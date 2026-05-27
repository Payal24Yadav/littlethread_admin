import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { downloadInvoice } from '../utils/invoice';
import {
  ChevronLeft,
  Package,
  Truck,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Clipboard,
  Pencil,
  X,
  Save
} from 'lucide-react';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState(null);
  const [shipLoading, setShipLoading] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [orderCancelLoading, setOrderCancelLoading] = useState(false);
  const [codConfirmLoading, setCodConfirmLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [returnRequest, setReturnRequest] = useState(null);
  const [processingReturn, setProcessingReturn] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsForm, setDetailsForm] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', pinCode: '' });

  useEffect(() => {
    fetchOrder();
    fetchShipment();
    fetchReturnRequest();
  }, [id]);

  const fetchReturnRequest = async () => {
    try {
      const res = await api.get(`/orders/${id}/return`);
      setReturnRequest(res.data);
    } catch {
      setReturnRequest(null);
    }
  };

  const approveReturn = async () => {
    if (!returnRequest?.id) return;
    if (!window.confirm('Approve this return/exchange request?')) return;
    setProcessingReturn(true);
    try {
      await api.put(`/orders/admin/returns/${returnRequest.id}/approve`);
      await fetchOrder();
      await fetchReturnRequest();
      alert('Return/Exchange request approved');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessingReturn(false);
    }
  };

  const rejectReturn = async () => {
    if (!returnRequest?.id) return;
    if (!window.confirm('Reject this return/exchange request?')) return;
    setProcessingReturn(true);
    try {
      await api.put(`/orders/admin/returns/${returnRequest.id}/reject`);
      await fetchOrder();
      await fetchReturnRequest();
      alert('Return/Exchange request rejected');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessingReturn(false);
    }
  };

  const markRefundComplete = async () => {
    if (!returnRequest?.id) return;
    if (!window.confirm('Mark refund as completed? Customer will receive notification email.')) return;
    setProcessingReturn(true);
    try {
      await api.put(`/orders/admin/returns/${returnRequest.id}/refund-complete`, {
        inspectionStatus: 'APPROVED'
      });
      await fetchReturnRequest();
      alert('Refund marked as completed. Email sent to customer.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to mark refund as complete');
    } finally {
      setProcessingReturn(false);
    }
  };

  const fetchShipment = async () => {
    try {
      const res = await api.get(`/shipping/order/${id}`);
      setShipment(res.data.shipment);
    } catch {
      setShipment(null);
    }
  };

  const createShipment = async () => {
    setShipLoading(true);
    try {
      const numeric = (v) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : 0;
      };

      const items = Array.isArray(order?.items) ? order.items : [];
      const derived = items.reduce(
        (acc, it) => {
          const qty = Math.max(1, Number(it.quantity || 0));
          const p = it.product || {};
          acc.weight += numeric(p.weight) * qty;
          acc.length = Math.max(acc.length, numeric(p.length));
          acc.breadth = Math.max(acc.breadth, numeric(p.breadth));
          acc.height += numeric(p.height) * qty;
          return acc;
        },
        { weight: 0, length: 0, breadth: 0, height: 0 }
      );

      const weight = derived.weight || 0.5;
      const length = derived.length || 10;
      const breadth = derived.breadth || 10;
      const height = derived.height || 5;

      const res = await api.post('/shipping/create', {
        orderId: id,
        address: {
          name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
          email: order.shippingAddress.email || order.customer?.email || '',
          phone: order.shippingAddress.phone,
          line1: order.shippingAddress.address,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          pincode: order.shippingAddress.pinCode,
          country: 'IN'
        },
        items: order.items.map(i => ({ productId: i.productId, name: i.product?.name, quantity: i.quantity, price: i.price })),
        totalAmount: order.totalAmount,
        weight,
        length,
        breadth,
        height,
      });
      setShipment(res.data.shipment);
      alert('Shipment created successfully');
    } catch (error) {
      const apiData = error?.response?.data;
      const detail = typeof apiData?.details === 'string'
        ? apiData.details
        : apiData?.details?.message || apiData?.details?.error || null;
      const message = apiData?.message || error?.message || 'Error creating shipment';
      const normalizedMessage = String(message || '').trim().toLowerCase();
      const normalizedDetail = String(detail || '').trim().toLowerCase();
      const shouldAppendDetail = normalizedDetail && normalizedDetail !== normalizedMessage;
      alert(shouldAppendDetail ? `${message}\n${detail}` : message);
    } finally {
      setShipLoading(false);
    }
  };

  const openLabel = async () => {
    if (!shipment) return;

    if (shipment.labelUrl) {
      window.open(shipment.labelUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setLabelLoading(true);
    try {
      const res = await api.get(`/shipping/label/${id}`);
      const labelUrl = res.data.label_url || res.data.shipment?.labelUrl;

      if (!labelUrl) {
        throw new Error('Label URL is not available for this shipment');
      }

      setShipment(res.data.shipment || shipment);
      window.open(labelUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      alert(error.response?.data?.message || error.message || 'Error downloading label');
    } finally {
      setLabelLoading(false);
    }
  };

  const schedulePickup = async () => {
    if (!shipment) return;

    setPickupLoading(true);
    try {
      const res = await api.post('/shipping/schedule-pickup', {
        orderId: id,
        shipmentId: shipment.shipment_id,
      });
      setShipment(res.data.shipment || shipment);
      alert('Pickup scheduled successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error scheduling pickup');
    } finally {
      setPickupLoading(false);
    }
  };

  const cancelShipment = async () => {
    if (!shipment) return;

    const confirmed = window.confirm('Cancel this shipment? This should only be used before pickup or dispatch.');
    if (!confirmed) return;

    setCancelLoading(true);
    try {
      await api.post('/shipping/cancel', {
        shipmentId: shipment.shipment_id,
      });
      await fetchShipment();
      alert('Shipment cancelled successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error cancelling shipment');
    } finally {
      setCancelLoading(false);
    }
  };

  const cancelOrder = async () => {
    const confirmed = window.confirm('Are you sure you want to cancel this order? This action cannot be undone.');
    if (!confirmed) return;

    setOrderCancelLoading(true);
    try {
      await api.post(`/orders/${id}/cancel`, {
        reason: 'Cancelled by admin'
      });
      alert('Order cancelled successfully. Inventory has been restored.');
      fetchOrder();
    } catch (error) {
      alert(error.response?.data?.message || 'Error cancelling order');
    } finally {
      setOrderCancelLoading(false);
    }
  };

  const confirmCODPayment = async () => {
    const confirmed = window.confirm('Confirm that COD payment has been received for this order?');
    if (!confirmed) return;

    setCodConfirmLoading(true);
    try {
      await api.post('/payments/confirm-cod', {
        orderId: id
      });
      alert('COD payment confirmed. Order is now active.');
      fetchOrder();
    } catch (error) {
      alert(error.response?.data?.message || 'Error confirming COD payment');
    } finally {
      setCodConfirmLoading(false);
    }
  };

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
      // Sync form with fetched data
      const addr = res.data.shippingAddress || {};
      setDetailsForm({
        name: `${addr.firstName || ''} ${addr.lastName || ''}`.trim(),
        email: addr.email || res.data.customer?.email || '',
        phone: addr.phone || '',
        address: addr.address || '',
        city: addr.city || '',
        state: addr.state || '',
        pinCode: addr.pinCode || '',
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDetails = async (syncShiprocket = false) => {
    setDetailsSaving(true);
    try {
      await api.patch(`/orders/${id}/details`, { ...detailsForm, syncShiprocket });
      setEditingDetails(false);
      fetchOrder();
      fetchShipment();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving order details');
    } finally {
      setDetailsSaving(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await api.put(`/orders/${id}`, { status: newStatus });
      await fetchOrder();
    } catch (error) {
      alert('Error updating order status');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-8 h-8 border-t-2 border-black dark:border-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] space-y-4">
        <AlertCircle size={48} className="text-gray-300" />
        <p className="text-sm font-black uppercase tracking-widest text-gray-500">Order not found</p>
        <button onClick={() => navigate('/orders')} className="text-xs font-black uppercase underline">Back to Orders</button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED': return 'text-emerald-500 bg-emerald-500/10';
      case 'AWB_ASSIGNED':
      case 'PICKUP_SCHEDULED':
      case 'PICKED':
      case 'SHIPPED':
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY': return 'text-blue-500 bg-blue-500/10';
      case 'PENDING':
      case 'PROCESSING': return 'text-amber-500 bg-amber-500/10';
      case 'CANCELLED':
      case 'CANCELED':
      case 'FAILED': return 'text-red-500 bg-red-500/10';
      case 'DELIVERED': return 'text-emerald-600 bg-emerald-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const shipmentStatus = shipment?.status?.toUpperCase?.() || '';
  const cancelDisabled =
    !shipment ||
    ['PICKED', 'SHIPPED', 'DELIVERED'].some((status) => shipmentStatus.includes(status)) ||
    cancelLoading;
  const orderStatusLabel = order?.status || 'PENDING';
  const shippingStatusLabel = shipment?.status || 'NOT_CREATED';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-20">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Order Details</h1>
            <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-1">Order #{order.invoiceNumber || order.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-widest ${getStatusColor(orderStatusLabel)}`}>
              {orderStatusLabel}
            </span>
            <span className={`px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-widest ${getStatusColor(shippingStatusLabel)}`}>
              {shippingStatusLabel.replace(/_/g, ' ')}
            </span>
          </div>
          {order.status !== 'DELIVERED' && !['CANCELLED', 'CANCELED', 'FAILED'].includes(order?.status?.toUpperCase()) && (
            <button
              type="button"
              onClick={() => updateStatus('DELIVERED')}
              disabled={statusUpdating}
              className="px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-widest bg-emerald-500 text-white hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {statusUpdating ? 'Updating...' : 'Mark Delivered'}
            </button>
          )}
          <button
            type="button"
            onClick={() => downloadInvoice(id)}
            className="px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-widest bg-black text-white hover:scale-[1.02] active:scale-95 transition-all"
          >
            Download Invoice
          </button>
        </div>
      </header>

      <main className="p-10 max-w-[95%] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Left Column - Order Content */}
        <div className="lg:col-span-2 space-y-8">

          {/* Items Section */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Order Items</h3>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[0.6rem] font-black rounded-lg uppercase tracking-widest">Allocated</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-8 flex items-center justify-between gap-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-20 rounded-2xl bg-gray-50 dark:bg-white/5 overflow-hidden ring-1 ring-black/5">
                      <img src={item.product?.thumbnailUrl} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black dark:text-white uppercase tracking-tight">{item.product?.name}</h4>
                      {item.variantTitle && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.variantTitle.split(',').map((part, pIdx) => {
                            const [key, val] = part.split(':').map(s => s.trim());
                            return (
                              <span key={pIdx} className="px-2.5 py-1 bg-black dark:bg-white dark:text-black text-white text-[0.65rem] font-black uppercase tracking-widest rounded-lg shadow-sm">
                                {val ? (
                                  <>
                                    <span className="opacity-50 mr-1">{key}:</span>
                                    {val}
                                  </>
                                ) : part}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-1">₹{item.price} × {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black dark:text-white italic">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Section */}
            <div className="p-8 bg-gray-50/50 dark:bg-white/2 border-t border-gray-100 dark:border-white/5 space-y-4">
              <div className="flex justify-between text-[0.65rem] font-bold uppercase tracking-widest text-gray-500">
                <span>Subtotal</span>
                <span className="text-gray-900 dark:text-white">₹{order.totalAmount}</span>
              </div>
              <div className="flex justify-between text-[0.65rem] font-bold uppercase tracking-widest text-gray-500">
                <span>Shipping</span>
                <span className="text-gray-900 dark:text-white">₹0.00</span>
              </div>
              <div className="flex justify-between text-base font-black uppercase tracking-tighter border-t border-gray-100 dark:border-white/5 pt-4">
                <span className="dark:text-white">Total</span>
                <span className="dark:text-white italic">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Exchange Box (show when exchange approved) */}
          {returnRequest && returnRequest.type === 'EXCHANGE' && returnRequest.status === 'APPROVED' && order?.items && order.items.length > 0 && (
            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Exchange Item</h3>
                <span className={`px-3 py-1 bg-blue-50 text-blue-600 text-[0.6rem] font-black rounded-lg uppercase tracking-widest`}>Exchange</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                <div className="p-8 flex items-center justify-between gap-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-20 rounded-2xl bg-gray-50 dark:bg-white/5 overflow-hidden ring-1 ring-black/5">
                      <img src={order.items[0].product?.thumbnailUrl} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black dark:text-white uppercase tracking-tight">{order.items[0].product?.name}</h4>
                      {returnRequest.preferredVariantTitle && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {returnRequest.preferredVariantTitle.split(',').map((part, pIdx) => {
                            const [key, val] = part.split(':').map(s => s.trim());
                            return (
                              <span key={pIdx} className="px-2.5 py-1 bg-black dark:bg-white dark:text-black text-white text-[0.65rem] font-black uppercase tracking-widest rounded-lg shadow-sm">
                                {val ? (
                                  <>
                                    <span className="opacity-50 mr-1">{key}:</span>
                                    {val}
                                  </>
                                ) : part}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black dark:text-white italic">Exchange</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Section */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Payments</h3>
              <span className={`px-2 py-1 rounded-md text-[0.55rem] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 text-xs font-bold text-gray-600 dark:text-gray-400">
                <div className="space-y-1">
                  <p className="text-[0.6rem] text-gray-400 uppercase tracking-widest">Transaction ID</p>
                  <p className="font-black dark:text-white uppercase tracking-tighter">#{order.razorpayPaymentId || order.razorpayOrderId || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[0.6rem] text-gray-400 uppercase tracking-widest">Payment Method</p>
                  <p className="font-black dark:text-white uppercase tracking-tighter">{(order.paymentMethod || 'Manual').toUpperCase()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[0.6rem] text-gray-400 uppercase tracking-widest">Payment Status</p>
                  <p className="font-black dark:text-white uppercase tracking-tighter">{(order.paymentStatus || (order.status === 'PAID' ? 'PAID' : 'UNPAID')).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.65rem] font-black dark:text-white italic">₹{order.totalAmount}</p>
                </div>
              </div>
              <button
                onClick={() => downloadInvoice(id)}
                className="w-full py-4 bg-gray-100 dark:bg-white/5 dark:text-white rounded-2xl text-[0.65rem] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all mb-2"
              >
                Download Invoice
              </button>
              {order.status === 'PENDING' && (
                <button className="w-full py-4 bg-black dark:bg-white dark:text-black text-white rounded-2xl text-[0.65rem] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
                  Capture Payment
                </button>
              )}
              {order.paymentMethod === 'cod' && (order.paymentStatus || '').toUpperCase() !== 'PAID' && (
                <button
                  onClick={confirmCODPayment}
                  disabled={codConfirmLoading}
                  className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[0.65rem] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {codConfirmLoading ? 'Confirming...' : 'Confirm COD Payment'}
                </button>
              )}
              {['PAID', 'COD_CONFIRMED', 'PENDING', 'PAYMENT_PENDING', 'COD_PENDING', 'ORDERED'].includes(order.status) && (
                <button
                  onClick={cancelOrder}
                  disabled={orderCancelLoading}
                  className="w-full py-4 bg-red-50 text-red-600 rounded-2xl text-[0.65rem] font-black uppercase tracking-widest hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50"
                >
                  {orderCancelLoading ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Customer Info */}
        <div className="space-y-8">

          {/* Customer Card */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b dark:border-white/5 pb-4">
              <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">Customer &amp; Delivery</h3>
              {!editingDetails ? (
                <button
                  onClick={() => setEditingDetails(true)}
                  className="flex items-center gap-1.5 text-[0.6rem] font-black uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  <Pencil size={12} /> Edit
                </button>
              ) : (
                <button
                  onClick={() => { setEditingDetails(false); fetchOrder(); }}
                  className="flex items-center gap-1.5 text-[0.6rem] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                >
                  <X size={12} /> Cancel
                </button>
              )}
            </div>

            {!editingDetails ? (
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl"><Mail size={16} className="text-gray-400" /></div>
                  <div className="flex-1">
                    <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Name / Email</p>
                    <p className="text-sm font-bold dark:text-white">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{order.shippingAddress?.email || order.customer?.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl"><Phone size={16} className="text-gray-400" /></div>
                  <div className="flex-1">
                    <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Phone</p>
                    <p className="text-sm font-bold dark:text-white">{order.shippingAddress?.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl"><MapPin size={16} className="text-gray-400" /></div>
                  <div className="flex-1">
                    <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Shipping Address</p>
                    <div className="text-sm font-bold dark:text-white space-y-0.5 mt-1 leading-relaxed">
                      <p>{order.shippingAddress?.address}</p>
                      <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pinCode}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                    <input
                      type="text"
                      value={detailsForm.name}
                      onChange={e => setDetailsForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">Email</label>
                    <input
                      type="email"
                      value={detailsForm.email}
                      onChange={e => setDetailsForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">Phone</label>
                    <input
                      type="tel"
                      value={detailsForm.phone}
                      onChange={e => setDetailsForm(p => ({ ...p, phone: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">Address Line</label>
                    <input
                      type="text"
                      value={detailsForm.address}
                      onChange={e => setDetailsForm(p => ({ ...p, address: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">City</label>
                    <input
                      type="text"
                      value={detailsForm.city}
                      onChange={e => setDetailsForm(p => ({ ...p, city: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">State</label>
                    <input
                      type="text"
                      value={detailsForm.state}
                      onChange={e => setDetailsForm(p => ({ ...p, state: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">PIN Code</label>
                    <input
                      type="text"
                      value={detailsForm.pinCode}
                      onChange={e => setDetailsForm(p => ({ ...p, pinCode: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </div>
                </div>

                <div className="grid gap-2 pt-2">
                  <button
                    onClick={() => handleSaveDetails(false)}
                    disabled={detailsSaving}
                    className="w-full py-3 bg-black dark:bg-white dark:text-black text-white rounded-xl text-[0.6rem] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Save size={14} /> {detailsSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {shipment && (
                    <p className="text-[0.55rem] text-amber-500 font-bold uppercase tracking-widest text-center">
                      ⚠ Shipment exists — cancel it first in Shiprocket before updating address.
                    </p>
                  )}
                  {!shipment && (
                    <button
                      onClick={() => handleSaveDetails(true)}
                      disabled={detailsSaving}
                      className="w-full py-3 bg-emerald-500 text-white rounded-xl text-[0.6rem] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Truck size={14} /> Save &amp; Create Shipment
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Shipment Management Card */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b dark:border-white/5 pb-4">
              <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">Shipping Management</h3>
              <Truck size={16} className="text-gray-400" />
            </div>

            {shipment ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                  <div>
                    <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">AWB / Tracking Number</p>
                    <p className="text-sm font-black dark:text-white uppercase tracking-tighter">{shipment.awb}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[0.6rem] font-black rounded-lg uppercase tracking-widest">
                    {shipment.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest ml-1">Courier Partner</p>
                  <p className="text-xs font-bold dark:text-white ml-1">{shipment.courier || 'Standard Delivery'}</p>
                </div>
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={openLabel}
                    disabled={labelLoading}
                    className="block text-center py-3 bg-gray-100 dark:bg-white/5 dark:text-white rounded-xl text-[0.6rem] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all underline decoration-dotted underline-offset-4 disabled:opacity-50"
                  >
                    {labelLoading ? 'Preparing Label...' : 'Download Label'}
                  </button>
                  {shipment.status === 'PICKUP_SCHEDULED' ? (
                    <div className="text-center py-3 bg-blue-500/10 text-blue-600 rounded-xl text-[0.6rem] font-black uppercase tracking-widest border border-blue-500/20">
                      Pickup Scheduled
                    </div>
                  ) : (order.status !== 'DELIVERED' && (
                    <button
                      type="button"
                      onClick={schedulePickup}
                      disabled={pickupLoading}
                      className="block text-center py-3 bg-blue-50 text-blue-600 rounded-xl text-[0.6rem] font-black uppercase tracking-widest hover:bg-blue-100 transition-all disabled:opacity-50"
                    >
                      {pickupLoading ? 'Scheduling Pickup...' : 'Schedule Pickup'}
                    </button>
                  ))}
                  {order.status !== 'DELIVERED' && (
                    <button
                      type="button"
                      onClick={cancelShipment}
                      disabled={cancelDisabled}
                      className="block text-center py-3 bg-red-50 text-red-600 rounded-xl text-[0.6rem] font-black uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelLoading ? 'Cancelling Shipment...' : 'Cancel Shipment'}
                    </button>
                  )}
                  {cancelDisabled && shipment && (
                    <p className="text-[0.55rem] font-bold uppercase tracking-widest text-gray-400">
                      Cancellation disabled after pickup, shipment, or delivery.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {['CANCELLED', 'CANCELED', 'FAILED'].includes(order?.status?.toUpperCase()) ? (
                  <div className="p-6 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-2xl">
                    <p className="text-[0.6rem] text-red-500 font-bold uppercase tracking-tight leading-relaxed">
                      Order is {order.status.toLowerCase()} — shipment cannot be created.
                    </p>
                  </div>
                ) : (
                  <div>
                    {order?.status?.toUpperCase() === 'DELIVERED' ? (
                      <div className="p-6 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl">
                        <p className="text-[0.6rem] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-tight leading-relaxed">
                          Order already delivered — shipment cannot be created.
                        </p>
                      </div>
                    ) : ['CANCELLED', 'CANCELED', 'FAILED'].includes(order?.status?.toUpperCase()) ? (
                      <div className="p-6 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-2xl">
                        <p className="text-[0.6rem] text-red-500 font-bold uppercase tracking-tight leading-relaxed">
                          Order is {order.status.toLowerCase()} — shipment cannot be created.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl">
                          <p className="text-[0.6rem] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-tight leading-relaxed">
                            No shipment manifest found for this order. Generate a shipment to start tracking.
                          </p>
                        </div>
                        <button
                          onClick={createShipment}
                          disabled={shipLoading}
                          className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[0.65rem] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                        >
                          {shipLoading ? 'Manifesting...' : 'Create Shipment'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
            <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 border-b dark:border-white/5 pb-4 mb-8">Activity Log</h3>
            <div className="space-y-10 relative">
              {(order.activities && order.activities.length > 0) ? (
                <>
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100 dark:bg-white/5"></div>
                  {order.activities.map((activity, idx) => {
                    // If EXCHANGE approved, hide refund amount from message
                    let displayMessage = activity.message;
                    if (returnRequest?.type === 'EXCHANGE' && activity.status === 'RETURN_APPROVED') {
                      displayMessage = 'Exchange request approved';
                    } else if (returnRequest?.type === 'EXCHANGE' && activity.status.includes('REFUND')) {
                      displayMessage = activity.message.replace(/Refund amount:[^\n]*/, '').trim();
                    }
                    return (
                      <div key={activity.id} className="relative flex gap-6">
                        <div className={`w-8 h-8 rounded-full ${idx === 0 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-gray-100 dark:bg-white/5'} flex items-center justify-center shrink-0 z-10 transition-transform hover:scale-110`}>
                          {idx === 0 ? (
                            <CheckCircle2 size={16} className="text-white" />
                          ) : (
                            <Clock size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black dark:text-white uppercase tracking-tight">{activity.status.replace(/_/g, ' ')}</p>
                          <p className="text-[0.6rem] text-gray-500 dark:text-gray-400 leading-relaxed font-bold">{displayMessage}</p>
                          <p className="text-[0.5rem] text-gray-400 font-bold uppercase tracking-widest">{new Date(activity.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">No detailed activity found</p>
                </div>
              )}
            </div>
          </div>

          {/* Return Request Card */}
          {returnRequest && (
            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
              <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 border-b dark:border-white/5 pb-4 mb-6">Customer Request</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[0.6rem] font-bold text-gray-500 uppercase">Type</span>
                  <span className={`px-3 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-widest ${returnRequest.type === 'EXCHANGE' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                    }`}>
                    {returnRequest.type || 'RETURN'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[0.6rem] font-bold text-gray-500 uppercase">Status</span>
                  <span className={`px-3 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-widest ${returnRequest.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' :
                      returnRequest.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                    }`}>
                    {returnRequest.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[0.6rem] font-bold text-gray-500 uppercase">Pickup Status</span>
                  <span className={`px-3 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-widest ${returnRequest.pickupStatus === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-500' :
                      returnRequest.pickupStatus === 'FAILED' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                    }`}>
                    {returnRequest.pickupStatus || 'REQUESTED'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[0.6rem] font-bold text-gray-500 uppercase">Inspection Status</span>
                  <span className={`px-3 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-widest ${returnRequest.inspectionStatus === 'APPROVED' || returnRequest.inspectionStatus === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-500' :
                      returnRequest.inspectionStatus === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                    }`}>
                    {returnRequest.inspectionStatus || 'PENDING'}
                  </span>
                </div>
                <div>
                  <span className="text-[0.6rem] font-bold text-gray-500 uppercase block mb-1">Reason</span>
                  <p className="text-xs font-bold dark:text-white">{returnRequest.reason}</p>
                </div>
                {returnRequest.preferredVariantTitle && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10">
                    <span className="text-[0.6rem] font-black text-blue-500 uppercase block mb-1">Preferred Exchange Variant</span>
                    <p className="text-sm font-black dark:text-white">{returnRequest.preferredVariantTitle}</p>
                  </div>
                )}
                {returnRequest.description && (
                  <div>
                    <span className="text-[0.6rem] font-bold text-gray-500 uppercase block mb-1">Description</span>
                    <p className="text-xs font-bold dark:text-white">{returnRequest.description}</p>
                  </div>
                )}
                {returnRequest.refundAmount && returnRequest.type !== 'EXCHANGE' && (
                  <div>
                    <span className="text-[0.6rem] font-bold text-gray-500 uppercase block mb-1">Refund Amount</span>
                    <p className="text-xs font-bold dark:text-white">₹{returnRequest.refundAmount.toFixed(2)}</p>
                  </div>
                )}
                {returnRequest.type === 'RETURN' && returnRequest.status === 'APPROVED' && (
                  <div className="flex justify-between items-center border-t dark:border-white/5 pt-4">
                    <div>
                      <span className="text-[0.6rem] font-bold text-gray-500 uppercase block mb-1">Refund Status</span>
                      <span className={`px-3 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-widest inline-block ${returnRequest.refundStatus === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                        {returnRequest.refundStatus || 'PENDING'}
                      </span>
                    </div>
                    {returnRequest.refundStatus !== 'COMPLETED' && (
                      <button
                        onClick={markRefundComplete}
                        disabled={processingReturn}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[0.75rem] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                      >
                        {processingReturn ? 'Processing...' : 'Mark Completed'}
                      </button>
                    )}
                  </div>
                )}
                {returnRequest.status === 'PENDING' && (
                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={approveReturn}
                      disabled={processingReturn}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[0.75rem] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      {processingReturn ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={rejectReturn}
                      disabled={processingReturn}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-[0.75rem] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      {processingReturn ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default OrderDetail;
