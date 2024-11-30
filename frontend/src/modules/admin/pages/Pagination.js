import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="pagination">
    <button 
      className="pagination-button" 
      onClick={() => onPageChange(currentPage - 1)} 
      disabled={currentPage === 1}
    >
      Anterior
    </button>
    <div className="pagination-numbers">
      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index + 1}
          className={`pagination-number ${currentPage === index + 1 ? 'active' : ''}`}
          onClick={() => onPageChange(index + 1)}
        >
          {index + 1}
        </button>
      ))}
    </div>
    <button 
      className="pagination-button" 
      onClick={() => onPageChange(currentPage + 1)} 
      disabled={currentPage === totalPages}
    >
      Siguiente
    </button>
  </div>
);

export default Pagination;