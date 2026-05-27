import api from './api';

/**
 * Triggers a download of the PDF invoice for a given order ID.
 * @param {string} orderId 
 */
export const downloadInvoice = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}/invoice`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `little-threads-invoice-${orderId}.pdf`);
    
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download invoice:', error);
    alert('Failed to download invoice.');
  }
};
