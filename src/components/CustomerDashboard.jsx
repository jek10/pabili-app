/**
 * Customer Dashboard Component - COMPACT HISTORY
 * Ongoing errands: Full details
 * Completed/Cancelled: Compact view
 */

 import { useState, useEffect } from 'react';
 import { supabase } from '../supabaseClient';
 import { uploadPhoto } from '../utils/photoUtils';
 import { calculateDistance } from '../utils/locationUtils';
 import Chat from './Chat';
 import NotificationBell from './NotificationBell';
 import ItemList from './ItemList';
 import { notifyErrandCancelled, notifyAgentRated } from '../utils/notificationTriggers';
 
 export default function CustomerDashboard({
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
 
   const [ongoingErrands, setOngoingErrands] = useState([]);
   const [completedErrands, setCompletedErrands] = useState([]);
   const [cancelledErrands, setCancelledErrands] = useState([]);
   const [showNewErrand, setShowNewErrand] = useState(false);
   const [items, setItems] = useState([]);
   const [deliveryAddress, setDeliveryAddress] = useState('');
   const [deliveryNotes, setDeliveryNotes] = useState('');
   const [itemsPhoto, setItemsPhoto] = useState(null);
   const [nearbyAgents, setNearbyAgents] = useState([]);
   const [uploading, setUploading] = useState(false);
   const [chatErrand, setChatErrand] = useState(null);
   const [expandedHistory, setExpandedHistory] = useState({});
 
   useEffect(() => {
     if (currentUser?.id) {
       loadMyErrands();
       loadNearbyAgents();
       loadSavedAddress();
     }
   }, [currentUser?.id]);
 
   const loadMyErrands = async () => {
     if (!currentUser?.id) return;
 
     const { data } = await supabase
       .from('errands')
       .select('*, agent:users!errands_agent_id_fkey(name, phone_number, id)')
       .eq('customer_id', currentUser.id)
       .order('created_at', { ascending: false });
 
     if (data) {
       const ongoing = data.filter(e => 
         e.status === 'posted' || e.status === 'accepted' || e.status === 'in_progress'
       );
       const completed = data.filter(e => e.status === 'completed');
       const cancelled = data.filter(e => e.status === 'cancelled');
       
       setOngoingErrands(ongoing);
       setCompletedErrands(completed);
       setCancelledErrands(cancelled);
     }
   };
 
   const loadNearbyAgents = async () => {
     if (!userLocation) return;
 
     const { data } = await supabase
       .from('users')
       .select('*')
       .eq('user_type', 'agent')
       .eq('is_active', true);
 
     if (data && userLocation) {
       const nearby = data.filter((agent) => {
         if (!agent.location_lat || !agent.location_lng) return false;
         const distance = calculateDistance(
           userLocation.lat,
           userLocation.lng,
           agent.location_lat,
           agent.location_lng
         );
         return distance <= 5;
       });
       setNearbyAgents(nearby);
     }
   };
 
   const loadSavedAddress = async () => {
     if (!currentUser?.id) return;
 
     const { data } = await supabase
       .from('users')
       .select('last_delivery_address, last_delivery_notes')
       .eq('id', currentUser.id)
       .single();
 
     if (data) {
       setDeliveryAddress(data.last_delivery_address || '');
       setDeliveryNotes(data.last_delivery_notes || '');
     }
   };
 
   const saveAddress = async (address, notes) => {
     await supabase
       .from('users')
       .update({
         last_delivery_address: address,
         last_delivery_notes: notes
       })
       .eq('id', currentUser.id);
   };
 
   const handlePhotoChange = (e) => {
     if (e.target.files && e.target.files[0]) {
       setItemsPhoto(e.target.files[0]);
     }
   };
 
   const createErrand = async (e) => {
     e.preventDefault();
     
     if (items.length === 0) {
       alert('Please add at least one item to your shopping list');
       return;
     }
 
     setUploading(true);
 
     if (!currentUser?.id) {
       alert('Session error. Please login again.');
       setUploading(false);
       return;
     }
 
     let itemsPhotoUrl = null;
 
     if (itemsPhoto) {
       itemsPhotoUrl = await uploadPhoto(itemsPhoto, 'items');
       if (!itemsPhotoUrl) {
         setUploading(false);
         return;
       }
     }
 
     const description = items.map(item => 
       `${item.quantity}x ${item.name}${item.notes ? ` (${item.notes})` : ''}`
     ).join(', ');
 
     const { error } = await supabase.from('errands').insert([
       {
         customer_id: currentUser.id,
         description: description,
         items: items,
         delivery_address: deliveryAddress,
         delivery_notes: deliveryNotes,
         items_photo_url: itemsPhotoUrl,
         location_lat: userLocation?.lat || 14.5995,
         location_lng: userLocation?.lng || 120.9842,
         status: 'posted',
       },
     ]);
 
     if (error) {
       alert('Error: ' + error.message);
       setUploading(false);
       return;
     }
 
     await saveAddress(deliveryAddress, deliveryNotes);
 
     setItems([]);
     setItemsPhoto(null);
     setShowNewErrand(false);
     setUploading(false);
     loadMyErrands();
     alert(`✅ Errand posted! ${nearbyAgents.length} agents nearby can see it.`);
   };
 
   const cancelErrand = async (errandId, errandStatus) => {
     let confirmMessage = 'Are you sure you want to cancel this errand?';
 
     if (errandStatus === 'accepted' || errandStatus === 'in_progress') {
       confirmMessage =
         '⚠️ An agent has already accepted this errand. Are you sure you want to cancel? This may affect your rating.';
     }
 
     if (!confirm(confirmMessage)) return;
 
     const reason = prompt('Reason for cancellation (optional):');
 
     const { error } = await supabase
       .from('errands')
       .update({
         status: 'cancelled',
         cancelled_by: currentUser.id,
         cancel_reason: reason || 'No reason provided',
         cancelled_at: new Date().toISOString(),
       })
       .eq('id', errandId);
 
     if (error) {
       alert('Error: ' + error.message);
       return;
     }
 
     const allErrands = [...ongoingErrands, ...completedErrands, ...cancelledErrands];
     const errand = allErrands.find(e => e.id === errandId);
     if (errand?.agent?.id) {
       await notifyErrandCancelled(
         errand.agent.id,
         currentUser.name,
         errand.description,
         errandId,
         reason || 'No reason provided'
       );
     }
 
     loadMyErrands();
     alert('✅ Errand cancelled successfully.');
   };
 
   const rateAgent = async (errandId, rating, review) => {
     const { error } = await supabase
       .from('errands')
       .update({
         customer_rating: rating,
         customer_review: review,
       })
       .eq('id', errandId);
 
     if (error) {
       alert('Error: ' + error.message);
       return;
     }
 
     const errand = completedErrands.find((e) => e.id === errandId);
     if (errand?.agent?.id) {
       const { data: agentData } = await supabase
         .from('users')
         .select('average_rating, total_ratings, id')
         .eq('id', errand.agent.id)
         .single();
 
       if (agentData) {
         const newTotalRatings = (agentData.total_ratings || 0) + 1;
         const currentAverage = agentData.average_rating || 5;
         const currentTotal = agentData.total_ratings || 0;
         const newAverage =
           (currentAverage * currentTotal + rating) / newTotalRatings;
 
         await supabase
           .from('users')
           .update({
             average_rating: newAverage,
             total_ratings: newTotalRatings,
           })
           .eq('id', agentData.id);
 
         await notifyAgentRated(
           errand.agent.id,
           currentUser.name,
           rating,
           errand.description,
           errandId
         );
       }
     }
 
     loadMyErrands();
     alert('✅ Rating submitted! Thank you for your feedback.');
   };
 
   const handleRateAgent = (errandId) => {
     const rating = prompt('Rate the agent (1-5 stars):');
     if (!rating || rating < 1 || rating > 5) {
       alert('Please enter a rating between 1 and 5');
       return;
     }
 
     const review = prompt('Any comments? (optional):');
     rateAgent(errandId, parseInt(rating), review || '');
   };
 
   const getTotalCost = (errand) => {
     if (!errand.item_prices) return null;
     
     let itemTotal = 0;
     if (errand.items) {
       errand.items.forEach(item => {
         const price = parseFloat(errand.item_prices[item.id]) || 0;
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
 
   const toggleExpanded = (errandId) => {
     setExpandedHistory(prev => ({
       ...prev,
       [errandId]: !prev[errandId]
     }));
   };
 
   // Full details for ongoing errands
   const renderOngoingErrand = (errand) => {
     const costs = getTotalCost(errand);
     
     return (
       <div key={errand.id} className="errand-card">
         <div className="errand-header">
           <span className={`status status-${errand.status}`}>
             {errand.status?.toUpperCase()}
           </span>
           <small>
             {errand.created_at && new Date(errand.created_at).toLocaleDateString()}
           </small>
         </div>
 
         {/* Shopping List */}
         {errand.items && errand.items.length > 0 ? (
           <div style={{ margin: '12px 0' }}>
             <strong>Shopping List:</strong>
             <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
               {errand.items.map((item, idx) => {
                 const itemPrice = errand.item_prices ? parseFloat(errand.item_prices[item.id]) || 0 : 0;
                 const itemQuantity = parseInt(item.quantity) || 1;
                 const itemSubtotal = itemPrice * itemQuantity;
                 
                 return (
                   <div key={idx} style={{ 
                     padding: '8px 12px', 
                     background: '#f9f9f9', 
                     borderRadius: '6px',
                     fontSize: '14px'
                   }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span>
                         <strong>{item.quantity}x</strong> {item.name}
                         {item.notes && <span style={{ color: '#666', fontSize: '13px' }}> ({item.notes})</span>}
                       </span>
                       {itemPrice > 0 && (
                         <div style={{ textAlign: 'right' }}>
                           <div style={{ fontSize: '12px', color: '#666' }}>
                             ₱{itemPrice.toFixed(2)} each
                           </div>
                           <div style={{ fontWeight: '600', color: '#4CAF50' }}>
                             ₱{itemSubtotal.toFixed(2)}
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
         ) : (
           <p><strong>Items:</strong> {errand.description}</p>
         )}
 
         {errand.items_photo_url && (
           <div className="errand-photos">
             <img src={errand.items_photo_url} alt="Items" onClick={() => window.open(errand.items_photo_url)} />
             <small>Items I requested</small>
           </div>
         )}
 
         <p><strong>Deliver to:</strong> {errand.delivery_address}</p>
         {errand.delivery_notes && (
           <p className="delivery-notes"><strong>Notes:</strong> {errand.delivery_notes}</p>
         )}
         {errand.agent && (
           <p className="agent-info">Agent: {errand.agent.name} ({errand.agent.phone_number})</p>
         )}
 
         {costs && (
           <div style={{ 
             marginTop: '12px', 
             padding: '12px', 
             background: '#E8F5E9', 
             borderRadius: '8px',
             border: '2px solid #4CAF50'
           }}>
             <div style={{ fontSize: '14px', marginBottom: '4px' }}>
               Items Total: <strong>₱{costs.items.toFixed(2)}</strong>
             </div>
             <div style={{ fontSize: '14px', marginBottom: '4px' }}>
               Service Fee: <strong>₱{costs.service.toFixed(2)}</strong>
             </div>
             <div style={{ fontSize: '16px', fontWeight: '700', color: '#2E7D32', borderTop: '2px solid #4CAF50', paddingTop: '8px', marginTop: '8px' }}>
               Grand Total: ₱{costs.total.toFixed(2)}
             </div>
           </div>
         )}
 
         {(errand.status === 'posted' || errand.status === 'accepted') && (
           <button
             onClick={() => cancelErrand(errand.id, errand.status)}
             style={{ marginTop: '10px', background: '#f44336', width: '100%' }}
           >
             ❌ Cancel Errand
           </button>
         )}
 
         {(errand.status === 'accepted' || errand.status === 'in_progress') && errand.agent && (
           <button 
             onClick={() => setChatErrand(errand)}
             style={{ marginTop: '10px', background: '#2196F3', width: '100%' }}
           >
             💬 Chat with Agent
           </button>
         )}
       </div>
     );
   };
 
   // Compact view for completed/cancelled
   const renderCompactErrand = (errand) => {
     const costs = getTotalCost(errand);
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
               {errand.agent && ` • ${errand.agent.name}`}
             </div>
           </div>
           <div style={{ textAlign: 'right', marginLeft: '12px' }}>
             {costs && (
               <div style={{ fontSize: '16px', fontWeight: '700', color: '#4CAF50' }}>
                 ₱{costs.total.toFixed(2)}
               </div>
             )}
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
 
             {errand.status === 'completed' && !errand.customer_rating && (
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   handleRateAgent(errand.id);
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
                 ⭐ Rate Agent
               </button>
             )}
 
             {errand.customer_rating && (
               <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                 Your Rating: {'⭐'.repeat(errand.customer_rating)}
               </div>
             )}
 
             {errand.status === 'cancelled' && (
               <div style={{ fontSize: '13px', color: '#f44336', marginTop: '8px' }}>
                 Cancelled: {errand.cancel_reason}
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
           <h2>👋 Hi, {currentUser.name || 'Customer'}!</h2>
           <small>Customer • {nearbyAgents.length} agents nearby</small>
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
           <NotificationBell currentUser={currentUser} />
           <button onClick={onLogout} className="logout-btn">
             Logout
           </button>
         </div>
       </div>
 
       {!showNewErrand ? (
         <button className="new-errand-btn" onClick={() => setShowNewErrand(true)}>
           + New Errand Request
         </button>
       ) : (
         <form onSubmit={createErrand} className="new-errand-form">
           <h3>What do you need?</h3>
           <ItemList items={items} setItems={setItems} />
 
           <label>Photo of items (optional):</label>
           <input type="file" accept="image/*" onChange={handlePhotoChange} className="file-input" />
           {itemsPhoto && (
             <div className="photo-preview">
               <img src={URL.createObjectURL(itemsPhoto)} alt="Preview" />
             </div>
           )}
 
           <label>Delivery Address:</label>
           <input
             type="text"
             placeholder="e.g., 123 Mabini St, Brgy. San Roque, Quezon City"
             value={deliveryAddress}
             onChange={(e) => setDeliveryAddress(e.target.value)}
             required
           />
 
           <label>Additional Directions (optional):</label>
           <textarea
             placeholder="e.g., Yellow gate, beside sari-sari store"
             value={deliveryNotes}
             onChange={(e) => setDeliveryNotes(e.target.value)}
             rows="2"
           />
 
           <div className="form-buttons">
             <button type="submit" disabled={uploading}>
               {uploading ? 'Posting...' : 'Post Errand'}
             </button>
             <button type="button" onClick={() => setShowNewErrand(false)} disabled={uploading}>
               Cancel
             </button>
           </div>
         </form>
       )}
 
       {/* Ongoing - Full Details */}
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
 
       {/* Cancelled - Compact */}
       {cancelledErrands.length > 0 && (
         <>
           <h3 style={{ marginTop: '20px' }}>❌ Cancelled ({cancelledErrands.length})</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             {cancelledErrands.map(errand => renderCompactErrand(errand))}
           </div>
         </>
       )}
 
       {ongoingErrands.length === 0 && completedErrands.length === 0 && cancelledErrands.length === 0 && (
         <p className="empty-state">No errands yet. Post your first one!</p>
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