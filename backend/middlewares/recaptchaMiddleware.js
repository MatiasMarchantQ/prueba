const failedAttempts = {};

const recaptchaMiddleware = async (req, res, next) => {
    const clientIP = req.ip;
    const { recaptchaToken } = req.body;

    console.log('📍 Iniciando verificación reCAPTCHA para IP:', clientIP);
    console.log('🎫 Token recibido:', recaptchaToken ? 'Presente' : 'Ausente');

    // Verifica si la IP está bloqueada temporalmente
    if (failedAttempts[clientIP]?.blocked) {
        const timeLeft = (failedAttempts[clientIP].blockExpires - Date.now()) / 1000;
        if (timeLeft > 0) {
            console.log('🚫 IP bloqueada:', clientIP, 'Tiempo restante:', Math.ceil(timeLeft));
            return res.status(429).json({ 
                message: `Demasiados intentos. Por favor espere ${Math.ceil(timeLeft)} segundos`,
                blocked: true,
                timeLeft: Math.ceil(timeLeft)
            });
        } else {
            console.log('🔓 Desbloqueando IP:', clientIP);
            delete failedAttempts[clientIP];
        }
    }
  
    if (!recaptchaToken) {
        console.log('❌ Token reCAPTCHA ausente');
        return res.status(400).json({ 
            message: 'Por favor, complete la verificación de reCAPTCHA',
            error: 'RECAPTCHA_REQUIRED'
        });
    }
  
    try {
        console.log('🔍 Verificando token reCAPTCHA...');
        const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
        const response = await fetch(verifyURL, { method: 'POST' });
  
        if (!response.ok) {
            console.error('❌ Error en la respuesta de reCAPTCHA:', response.status);
            throw new Error('Error en la verificación de reCAPTCHA');
        }
  
        const data = await response.json();
        console.log('📊 Respuesta reCAPTCHA:', {
            success: data.success,
            score: data.score,
            action: data.action
        });

        // Evaluación del score
        if (!data.success || data.score < 0.2) {
            // Registra el intento fallido
            if (!failedAttempts[clientIP]) {
                failedAttempts[clientIP] = {
                    count: 1,
                    firstAttempt: Date.now()
                };
            } else {
                failedAttempts[clientIP].count++;
            }

            console.log('⚠️ Intento fallido para IP:', clientIP, 'Count:', failedAttempts[clientIP].count);

            // Si hay 3 o más intentos en menos de 5 minutos, bloquea la IP
            if (failedAttempts[clientIP].count >= 4 && 
                (Date.now() - failedAttempts[clientIP].firstAttempt) < 300000) {
                
                failedAttempts[clientIP].blocked = true;
                failedAttempts[clientIP].blockExpires = Date.now() + 300000; // 5 minutos

                console.log('🔒 IP bloqueada:', clientIP);
                return res.status(429).json({
                    message: 'Demasiados intentos fallidos. IP bloqueada por 5 minutos',
                    blocked: true,
                    timeLeft: 300 // 5 minutos en segundos
                });
            }

            const attemptsLeft = 4 - failedAttempts[clientIP].count;
            let response = {
                success: false,
                message: '',
                score: data.score,
                attemptsLeft
            };

            if (data.score < 0.2) {
                console.log('⚠️ Score muy bajo detectado:', data.score);
                response.message = `Verificación fallida. ${attemptsLeft} intentos restantes antes del bloqueo`;
                return res.status(403).json(response);
            } else {
                response.message = `Verificación fallida. ${attemptsLeft} intentos restantes antes del bloqueo`;
                return res.status(400).json(response);
            }
        }

        // Verificación exitosa
        console.log('✅ Verificación reCAPTCHA exitosa');
        delete failedAttempts[clientIP];
        next();

    } catch (error) {
        console.error('❌ Error en la verificación:', error);
        return res.status(500).json({ 
            message: 'Error en la verificación de seguridad',
            error: error.message
        });
    }
};

export default recaptchaMiddleware;