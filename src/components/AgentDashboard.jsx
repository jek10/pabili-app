/**
 * Agent Dashboard Component - COMPACT HISTORY
 * Ongoing errands: Full details with shopping list
 * Completed: Compact expandable view
 */

 import { useState, useEffect } from 'react';
 import { supabase } from '../supabaseClient';
 import { uploadPhoto } from '../utils/photoUtils';
 import { calculateDistance, openDirections } from '../utils/locationUtils';
 import Chat from './Chat';
 import NotificationBell from './NotificationBell';
 import { notifyErrandAccepted, notifyErrandCompleted, notifyCustomerRated } from '../utils/notificationTriggers';
 
 export default function AgentDashboard({
   currentUser,
   userLocation,
   onLogout,
 }) {
   if (!currentUser) {
     return (
       <div style={{
         padding: '40px',
         textAlign: 'center',
         minHeight: '100vh',
         display: 'flex',
         flexDirection: 'column',
         justifyContent: 'center',
         alignItems: 'center',
         background: '#f8f9fa',
       }}>
         <h2>Logging out...</h2>
         <p>Returning to login screen</p>
         <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
           You will be redirected shortly
         </div>
       </div>
     );
   }
 
   const [availableErrands, setAvailableErrands] = useState([]);
   const [ongoingErrands, setOngoingErrands] = useState([]);
   const [completedErrands, setCompletedErrands] = useState([]);
   const [uploadingReceipt, setUploadingReceipt] = useState(null);
   const [showEarnings, setShowEarnings] = useState(false);
   const [earnings, setEarnings] = useState({
     total: 0,
     completed: 0,
     pending: 0,
     history: [],
   });
   const [chatErrand, setChatErrand] = useState(null);
   const [itemPrices, setItemPrices] = useState({});
   const [checkedItems, setCheckedItems] = useState({});
   const [expandedHistory, setExpandedHistory] = useState({});
 
   useEffect(() => {
     if (currentUser?.id) {
       loadErrands();
       loadEarnings();
     }
   }, [currentUser?.id]);
 
   const loadErrands = async () => {
     if (!currentUser?.id) return;
 
     const { data: available } = await supabase
       .from('errands')
       .select(
         '*, users!errands_customer_id_fkey(name, phone_number, average_rating, id)'
       )
       .eq('status', 'posted')
       .order('created_at', { ascending: false });
 
     if (available && userLocation) {
       const nearby = available
         .filter((errand) => {
           if (!errand.location_lat || !errand.location_lng) return false;
           const distance = calculateDistance(
             userLocation.lat,
             userLocation.lng,
             errand.location_lat,
             errand.location_lng
           );
           return distance <= 2;
         })
         .map((errand) => {
           const distance = calculateDistance(
             userLocation.lat,
             userLocation.lng,
             errand.location_lat,
             errand.location_lng
           );
           return { ...errand, distance };
         });
 
       setAvailableErrands(nearby);
     } else {
       setAvailableErrands(available || []);
     }
 
     const { data: myErrands } = await supabase
       .from('errands')
       .select(
         '*, users!errands_customer_id_fkey(name, phone_number, location_lat, location_lng, id, average_rating)'
       )
       .eq('agent_id', currentUser.id)
       .order('created_at', { ascending: false });
 
     if (myErrands) {
       const ongoing = myErrands.filter(e => e.status === 'accepted' || e.status === 'in_progress');
       const completed = myErrands.filter(e => e.status === 'completed');
       
       setOngoingErrands(ongoing);
       setCompletedErrands(completed);
       
       myErrands.forEach(errand => {
         if (errand.item_prices) {
           setItemPrices(prev => ({ ...prev, [errand.id]: errand.item_prices }));
         }
       });
     }
   };
 
   const loadEarnings = async () => {
     if (!currentUser?.id) return;
 
     const { data } = await supabase
       .from('errands')
       .select('*')
       .eq('agent_id', currentUser.id)
       .in('status', ['completed', 'accepted', 'in_progress'])
       .order('completed_at', { ascending: false});
 
     if (data) {
       const completedErrands = data.filter((e) => e.status === 'completed');
       const pendingErrands = data.filter(
         (e) => e.status === 'accepted' || e.status === 'in_progress'
       );
 
       const totalEarnings = completedErrands.reduce(
         (sum, e) => sum + (parseFloat(e.service_fee) || 0),
         0
       );
       const pendingEarnings = pendingErrands.reduce(
         (sum, e) => sum + (parseFloat(e.service_fee) || 0),
         0
       );
 
       setEarnings({
         total: totalEarnings,
         completed: completedErrands.length,
         pending: pendingEarnings,
         history: completedErrands,
       });
     }
   };
 
   const acceptErrand = async (errandId) => {
     const fee = prompt('Enter your service fee (₱):');
     if (!fee) return;
 
     const { error } = await supabase
       .from('errands')
       .update({
         agent_id: currentUser.id,
         status: 'accepted',
         service_fee: parseFloat(fee),
       })
       .eq('id', errandId);
 
     if (error) {
       alert('Error: ' + error.message);
       return;
     }
 
     const errand = availableErrands.find(e => e.id === errandId);
     if (errand?.users?.id) {
       await notifyErrandAccepted(
         errand.users.id,
         currentUser.name,
         errand.description,
         errandId
       );
     }
 
     loadErrands();
     loadEarnings();
     alert('✅ Errand accepted! Contact the customer and buy the items.');
   };
 
   const updateItemPrice = (errandId, itemId, price) => {
     setItemPrices(prev => ({
       ...prev,
       [errandId]: {
         ...(prev[errandId] || {}),
         [itemId]: price
       }
     }));
     
     autoSavePrices(errandId, {
       ...(itemPrices[errandId] || {}),
       [itemId]: price
     });
   };
 
   const autoSavePrices = async (errandId, prices) => {
     await supabase
       .from('errands')
       .update({
         item_prices: prices,
         status: 'in_progress'
       })
       .eq('id', errandId);
     
     loadErrands();
   };
 
   const toggleItemChecked = (errandId, itemId) => {
     setCheckedItems(prev => ({
       ...prev,
       [errandId]: {
         ...(prev[errandId] || {}),
         [itemId]: !prev[errandId]?.[itemId]
       }
     }));
   };
 
   const calculateTotal = (errand) => {
     const prices = itemPrices[errand.id] || errand.item_prices || {};
     
     let itemTotal = 0;
     if (errand.items) {
       errand.items.forEach(item => {
         const price = parseFloat(prices[item.id]) || 0;
         const quantity = parseInt(item.quantity) || 1;
         itemTotal += price * quantity;
       });
     }
     
     const serviceFee = parseFloat(errand.service_fee) || 0;
     return {
       items: itemTotal,
       service: serviceFee,
       total: itemTotal + serviceFee
     };
   };
 
   const handleReceiptUpload = async (errandId, file) => {
     setUploadingReceipt(errandId);
 
     const receiptUrl = await uploadPhoto(file, 'receipts');
 
     if (receiptUrl) {
       const { error } = await supabase
         .from('errands')
         .update({
           status: 'completed',
           receipt_photo_url: receiptUrl,
           completed_at: new Date().toISOString(),
         })
         .eq('id', errandId);
 
       if (error) {
         alert('Error: ' + error.message);
       } else {
         const errand = ongoingErrands.find(e => e.id === errandId);
         if (errand?.users?.id) {
           await notifyErrandCompleted(
             errand.users.id,
             currentUser.name,
             errand.description,
             errandId
           );
         }
 
         alert('✅ Errand completed with receipt! Collect your payment.');
         loadErrands();
         loadEarnings();
       }
     }
 
     setUploadingReceipt(null);
   };
 
   const rateCustomer = async (errandId, rating, review) => {
     const { error } = await supabase
       .from('errands')
       .update({
         agent_rating: rating,
         agent_review: review,
       })
       .eq('id', errandId);
 
     if (error) {
       alert('Error: ' + error.message);
       return;
     }
 
     const errand = completedErrands.find((e) => e.id === errandId);
     if (errand?.users?.id) {
       const { data: customerData } = await supabase
         .from('users')
         .select('average_rating, total_ratings, id')
         .eq('id', errand.users.id)
         .single();
 
       if (customerData) {
         const newTotalRatings = (customerData.total_ratings || 0) + 1;
         const currentAverage = customerData.average_rating || 5;
         const currentTotal = customerData.total_ratings || 0;
         const newAverage =
           (currentAverage * currentTotal + rating) / newTotalRatings;
 
         await supabase
           .from('users')
           .update({
             average_rating: newAverage,
             total_ratings: newTotalRatings,
           })
           .eq('id', customerData.id);
 
         await notifyCustomerRated(
           errand.users.id,
           currentUser.name,
           rating,
           errand.description,
           errandId
         );
       }
     }
 
     loadErrands();
     alert('✅ Rating submitted! Thank you for your feedback.');
   };
 
   const handleRateCustomer = (errandId) => {
     const rating = prompt('Rate the customer (1-5 stars):');
     if (!rating || rating < 1 || rating > 5) {
       alert('Please enter a rating between 1 and 5');
       return;
     }
 
     const review = prompt('Any comments? (optional):');
     rateCustomer(errandId, parseInt(rating), review || '');
   };
 
   const toggleExpanded = (errandId) => {
     setExpandedHistory(prev => ({
       ...prev,
       [errandId]: !prev[errandId]
     }));
   };
 
   // Full details for ongoing
   const renderOngoingErrand = (errand) => {
     const totals = calculateTotal(errand);
     
     return (
       <div key={errand.id} className="errand-card accepted">
         {errand.items && errand.items.length > 0 ? (
           <div style={{ margin: '12px 0' }}>
             <strong>Shopping List:</strong>
             <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
               {errand.items.map((item) => {
                 const itemPrice = parseFloat((itemPrices[errand.id] || errand.item_prices || {})[item.id]) || 0;
                 const itemQuantity = parseInt(item.quantity) || 1;
                 const itemSubtotal = itemPrice * itemQuantity;
                 
                 return (
                   <div key={item.id} style={{ 
                     padding: '12px', 
                     background: checkedItems[errand.id]?.[item.id] ? '#E8F5E9' : '#f9f9f9', 
                     borderRadius: '8px',
                     border: '2px solid',
                     borderColor: checkedItems[errand.id]?.[item.id] ? '#4CAF50' : '#e0e0e0'
                   }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                       <input
                         type="checkbox"
                         checked={checkedItems[errand.id]?.[item.id] || false}
                         onChange={() => toggleItemChecked(errand.id, item.id)}
                         style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                       />
                       <div style={{ flex: 1 }}>
                         <div style={{ fontWeight: '600', fontSize: '14px' }}>
                           <strong>{item.quantity}x</strong> {item.name}
                         </div>
                         {item.notes && (
                           <div style={{ fontSize: '13px', color: '#666' }}>
                             {item.notes}
                           </div>
                         )}
                       </div>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                       <label style={{ fontSize: '13px', fontWeight: '600' }}>Price per unit:</label>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                         <span style={{ fontWeight: '600' }}>₱</span>
                         <input
                           type="number"
                           step="0.01"
                           min="0"
                           placeholder="0.00"
                           value={(itemPrices[errand.id] || errand.item_prices || {})[item.id] || ''}
                           onChange={(e) => updateItemPrice(errand.id, item.id, e.target.value)}
                           style={{
                             flex: 1,
                             padding: '8px',
                             border: '2px solid #ddd',
                             borderRadius: '6px',
                             fontSize: '14px',
                             minWidth: '80px'
                           }}
                         />
                       </div>
                       {itemPrice > 0 && (
                         <div style={{ 
                           fontSize: '13px', 
                           fontWeight: '700', 
                           color: '#4CAF50',
                           padding: '6px 12px',
                           background: '#E8F5E9',
                           borderRadius: '6px'
                         }}>
                           Subtotal: ₱{itemSubtotal.toFixed(2)}
                         </div>
                       )}
                     </div>
                   </div>
                 );
               })}
             </div>
 
             <div style={{ 
               marginTop: '12px', 
               padding: '12px', 
               background: '#E3F2FD', 
               borderRadius: '8px',
               border: '2px solid #2196F3'
             }}>
               <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                 Items Total: <strong>₱{totals.items.toFixed(2)}</strong>
               </div>
               <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                 Service Fee: <strong>₱{totals.service.toFixed(2)}</strong>
               </div>
               <div style={{ fontSize: '16px', fontWeight: '700', color: '#0D47A1', borderTop: '2px solid #2196F3', paddingTop: '8px', marginTop: '8px' }}>
                 Grand Total: ₱{totals.total.toFixed(2)}
               </div>
             </div>
           </div>
         ) : (
           <p><strong>Items:</strong> {errand.description || '—'}</p>
         )}
 
         <p><strong>Deliver to:</strong> {errand.delivery_address || '—'}</p>
         {errand.delivery_notes && (
           <p className="delivery-notes"><strong>📝 Notes:</strong> {errand.delivery_notes}</p>
         )}
         <p><strong>Customer:</strong> {errand.users?.name || '—'}</p>
         <p><strong>Phone:</strong> {errand.users?.phone_number || '—'}</p>
 
         <div className="errand-actions">
           <label className="upload-receipt-btn">
             {uploadingReceipt === errand.id ? 'Uploading...' : '📸 Upload Receipt & Complete'}
             <input
               type="file"
               accept="image/*"
               onChange={(e) => {
                 if (e.target.files?.[0]) {
                   handleReceiptUpload(errand.id, e.target.files[0]);
                 }
               }}
               disabled={uploadingReceipt === errand.id}
               style={{ display: 'none' }}
             />
           </label>
           <button onClick={() => openDirections(userLocation, errand.delivery_address)} className="directions-btn">
             🗺️ Directions
           </button>
         </div>
 
         <button 
           onClick={() => setChatErrand(errand)}
           style={{ marginTop: '10px', background: '#2196F3', width: '100%' }}
         >
           💬 Chat with Customer
         </button>
       </div>
     );
   };
 
   // Compact for completed
   const renderCompactErrand = (errand) => {
     const totals = calculateTotal(errand);
     const isExpanded = expandedHistory[errand.id];
     const itemCount = errand.items?.length || 0;
     
     return (
       <div 
         key={errand.id} 
         style={{
           background: 'white',
           padding: '14px',
           borderRadius: '8px',
           boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
           cursor: 'pointer',
           transition: 'all 0.3s ease'
         }}
         onClick={() => toggleExpanded(errand.id)}
       >
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ flex: 1 }}>
             <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
               {itemCount} {itemCount === 1 ? 'item' : 'items'} • {errand.description?.substring(0, 40)}...
             </div>
             <div style={{ fontSize: '12px', color: '#666' }}>
               {errand.created_at && new Date(errand.created_at).toLocaleDateString()}
               {errand.users && ` • ${errand.users.name}`}
             </div>
           </div>
           <div style={{ textAlign: 'right', marginLeft: '12px' }}>
             <div style={{ fontSize: '16px', fontWeight: '700', color: '#4CAF50' }}>
               ₱{totals.service.toFixed(2)}
             </div>
             <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
               {isExpanded ? '▼' : '▶'}
             </div>
           </div>
         </div>
 
         {isExpanded && (
           <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
             {errand.items && errand.items.length > 0 && (
               <div style={{ marginBottom: '10px' }}>
                 {errand.items.map((item, idx) => {
                   const itemPrice = errand.item_prices ? parseFloat(errand.item_prices[item.id]) || 0 : 0;
                   const itemQuantity = parseInt(item.quantity) || 1;
                   const itemSubtotal = itemPrice * itemQuantity;
                   
                   return (
                     <div key={idx} style={{ 
                       padding: '6px 10px', 
                       background: '#f9f9f9', 
                       borderRadius: '4px',
                       marginBottom: '4px',
                       fontSize: '13px',
                       display: 'flex',
                       justifyContent: 'space-between'
                     }}>
                       <span>{item.quantity}x {item.name}</span>
                       {itemPrice > 0 && <span style={{ fontWeight: '600' }}>₱{itemSubtotal.toFixed(2)}</span>}
                     </div>
                   );
                 })}
                 <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e0e0e0', fontSize: '14px', fontWeight: '600' }}>
                   Your earnings: ₱{totals.service.toFixed(2)}
                 </div>
               </div>
             )}
 
             {/* Photos in expanded view */}
             {errand.items_photo_url && (
               <div style={{ marginBottom: '10px' }}>
                 <img
                   src={errand.items_photo_url}
                   alt="Items"
                   onClick={(e) => {
                     e.stopPropagation();
                     window.open(errand.items_photo_url);
                   }}
                   style={{
                     maxWidth: '100%',
                     maxHeight: '150px',
                     borderRadius: '6px',
                     border: '2px solid #4CAF50',
                     cursor: 'pointer'
                   }}
                 />
                 <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Items photo</div>
               </div>
             )}
 
             {errand.receipt_photo_url && (
               <div style={{ marginBottom: '10px' }}>
                 <img
                   src={errand.receipt_photo_url}
                   alt="Receipt"
                   onClick={(e) => {
                     e.stopPropagation();
                     window.open(errand.receipt_photo_url);
                   }}
                   style={{
                     maxWidth: '100%',
                     maxHeight: '150px',
                     borderRadius: '6px',
                     border: '2px solid #4CAF50',
                     cursor: 'pointer'
                   }}
                 />
                 <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Receipt</div>
               </div>
             )}
 
             {!errand.agent_rating && (
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   handleRateCustomer(errand.id);
                 }}
                 style={{ 
                   width: '100%', 
                   padding: '10px', 
                   background: '#FF9800', 
                   color: 'white',
                   border: 'none',
                   borderRadius: '6px',
                   fontWeight: '600',
                   cursor: 'pointer',
                   marginTop: '8px'
                 }}
               >
                 ⭐ Rate Customer
               </button>
             )}
 
             {errand.agent_rating && (
               <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                 Your Rating: {'⭐'.repeat(errand.agent_rating)}
               </div>
             )}
           </div>
         )}
       </div>
     );
   };
 
   return (
     <div className="dashboard">
       <div className="header">
         <div>
           <h2>👋 Hi, {currentUser.name || 'Agent'}!</h2>
           <small>Agent • {availableErrands.length} errands nearby</small>
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
           <NotificationBell currentUser={currentUser} />
           <button onClick={onLogout} className="logout-btn">Logout</button>
         </div>
       </div>
 
       {/* Earnings Card */}
       <div
         className="earnings-card"
         style={{
           background: '#E8F5E9',
           padding: '16px',
           borderRadius: '12px',
           marginBottom: '20px',
           cursor: 'pointer',
         }}
         onClick={() => setShowEarnings(!showEarnings)}
       >
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
             <h3 style={{ margin: 0, color: '#2E7D32', fontSize: '18px' }}>💰 Total Earnings</h3>
             <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#1B5E20' }}>
               ₱{earnings.total.toFixed(2)}
             </p>
             <small style={{ color: '#558B2F' }}>
               {earnings.completed} completed errands • ₱{earnings.pending.toFixed(2)} pending
             </small>
           </div>
           <div style={{ fontSize: '24px' }}>{showEarnings ? '▼' : '▶'}</div>
         </div>
       </div>
 
       {showEarnings && (
         <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
           <h3 style={{ marginTop: 0 }}>📊 Earnings History</h3>
           {earnings.history.length === 0 ? (
             <p style={{ color: '#999', textAlign: 'center' }}>No completed errands yet</p>
           ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               {earnings.history.map((errand) => (
                 <div key={errand.id} style={{ padding: '12px', background: '#f9f9f9', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                       {errand.description?.substring(0, 40) || 'No description'}...
                     </p>
                     <small style={{ color: '#666' }}>
                       {errand.completed_at && new Date(errand.completed_at).toLocaleDateString()}
                     </small>
                   </div>
                   <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4CAF50' }}>
                     ₱{errand.service_fee || '—'}
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       )}
 
       <h3>🆕 Available Errands (within 2km)</h3>
       <div className="errands-list">
         {availableErrands.length === 0 ? (
           <p className="empty-state">No errands available nearby right now.</p>
         ) : (
           availableErrands.map((errand) => (
             <div key={errand.id} className="errand-card">
               <div className="distance-badge">📍 {errand.distance?.toFixed(1) || '?'} km away</div>
 
               {errand.items && errand.items.length > 0 ? (
                 <div style={{ margin: '12px 0' }}>
                   <strong>Shopping List:</strong>
                   <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                     {errand.items.map((item, idx) => (
                       <div key={idx} style={{ padding: '8px 12px', background: '#f9f9f9', borderRadius: '6px', fontSize: '14px' }}>
                         <strong>{item.quantity}x</strong> {item.name}
                         {item.notes && <span style={{ color: '#666', fontSize: '13px' }}> ({item.notes})</span>}
                       </div>
                     ))}
                   </div>
                 </div>
               ) : (
                 <p><strong>Items needed:</strong> {errand.description || '—'}</p>
               )}
 
               <p><strong>Deliver to:</strong> {errand.delivery_address || '—'}</p>
               <p><strong>Customer:</strong> {errand.users?.name || '—'}</p>
               <p><strong>Phone:</strong> {errand.users?.phone_number || '—'}</p>
               <p><strong>Rating:</strong> {'⭐'.repeat(Math.round(errand.users?.average_rating || 5))} ({(errand.users?.average_rating || 5).toFixed(1)})</p>
 
               <div className="errand-actions">
                 <button onClick={() => acceptErrand(errand.id)}>Accept Errand</button>
                 <button onClick={() => openDirections(userLocation, errand.delivery_address)} className="directions-btn">
                   🗺️ Directions
                 </button>
               </div>
             </div>
           ))
         )}
       </div>
 
       {/* Ongoing - Full */}
       {ongoingErrands.length > 0 && (
         <>
           <h3>📋 Ongoing Errands ({ongoingErrands.length})</h3>
           <div className="errands-list">
             {ongoingErrands.map(errand => renderOngoingErrand(errand))}
           </div>
         </>
       )}
 
       {/* Completed - Compact */}
       {completedErrands.length > 0 && (
         <>
           <h3>✅ Completed ({completedErrands.length})</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             {completedErrands.map(errand => renderCompactErrand(errand))}
           </div>
         </>
       )}
 
       {ongoingErrands.length === 0 && completedErrands.length === 0 && (
         <p className="empty-state">No active or completed errands.</p>
       )}
 
       {chatErrand && (
         <Chat 
           errand={chatErrand}
           currentUser={currentUser}
           onClose={() => setChatErrand(null)}
         />
       )}
     </div>
   );
 }