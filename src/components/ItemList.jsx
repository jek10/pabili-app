/**
 * ItemList Component
 * Manages shopping list items with add/remove functionality
 */

import { useState } from 'react';

export default function ItemList({ items, setItems }) {
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, notes: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const addItem = () => {
    if (!newItem.name.trim()) {
      alert('Please enter item name');
      return;
    }

    const item = {
      id: Date.now(),
      name: newItem.name.trim(),
      quantity: parseInt(newItem.quantity) || 1,
      notes: newItem.notes.trim(),
    };

    setItems([...items, item]);
    setNewItem({ name: '', quantity: 1, notes: '' });
    setShowAddForm(false);
  };

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label
        style={{ display: 'block', fontWeight: '600', marginBottom: '10px' }}
      >
        Items to Buy:
      </label>

      {/* Item List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            style={{
              background: '#f9f9f9',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #e0e0e0',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: '600',
                    fontSize: '15px',
                    marginBottom: '4px',
                  }}
                >
                  {index + 1}. {item.name}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  Quantity: <strong>{item.quantity}</strong>
                  {item.notes && (
                    <>
                      {' '}
                      • Notes: <em>{item.notes}</em>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                style={{
                  padding: '6px 12px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Item Form */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          style={{
            width: '100%',
            padding: '12px',
            background: '#2196F3',
            color: 'white',
            border: '2px dashed #1976D2',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          + Add Item
        </button>
      ) : (
        <div
          style={{
            background: '#E3F2FD',
            padding: '16px',
            borderRadius: '8px',
            border: '2px solid #2196F3',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '4px',
              }}
            >
              Item Name *
            </label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="e.g., Lucky Me Pancit Canton"
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr',
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '4px',
                }}
              >
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem({ ...newItem, quantity: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '4px',
                }}
              >
                Notes (optional)
              </label>
              <input
                type="text"
                value={newItem.notes}
                onChange={(e) =>
                  setNewItem({ ...newItem, notes: e.target.value })
                }
                placeholder="e.g., Chilimansi flavor"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={addItem}
              style={{
                flex: 1,
                padding: '10px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              Add Item
            </button>
            <button
              type="button"
              onClick={() => {
                setNewItem({ name: '', quantity: 1, notes: '' });
                setShowAddForm(false);
              }}
              style={{
                flex: 1,
                padding: '10px',
                background: '#ddd',
                color: '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !showAddForm && (
        <p
          style={{
            textAlign: 'center',
            color: '#999',
            fontSize: '13px',
            marginTop: '8px',
          }}
        >
          No items added yet. Click "+ Add Item" to start.
        </p>
      )}
    </div>
  );
}
