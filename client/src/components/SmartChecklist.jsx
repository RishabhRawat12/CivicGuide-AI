import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { getChecklist, updateChecklist } from '../services/api';
import toast from 'react-hot-toast';
import { FiCheckSquare, FiCheck } from 'react-icons/fi';

export default function SmartChecklist({ onProgressChange }) {
  const { user, checklist, setChecklist } = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Derive progress from items
  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Initial load from context
  useEffect(() => {
    if (checklist?.items) {
      setItems(checklist.items);
      setLoading(false);
    }
  }, [checklist]);

  const toggleItem = async (itemKey) => {
    const newItems = items.map(item => 
      item.key === itemKey ? { ...item, completed: !item.completed } : item
    );

    // Optimistic update
    setItems(newItems);
    onProgressChange?.(newItems);

    try {
      const { data } = await updateChecklist(newItems);
      if (data.success) {
        setItems(data.data.items);
        setChecklist(data.data); // Update global context
        toast.success('Checklist updated! ✨');
      }
    } catch (e) {
      // Rollback on failure
      setItems(items);
      onProgressChange?.(items);
      toast.error('Failed to update checklist');
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0">
          <FiCheckSquare className="text-primary" /> Smart Checklist
        </h2>
        <span className="text-sm font-semibold text-primary">
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="w-full h-2 rounded-full bg-border mb-4 overflow-hidden">
        <motion.div className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="loading-shimmer h-14 w-full" />)}
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {items.map((item, i) => (
            <motion.div key={item.key}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => toggleItem(item.key)}
              className={`checklist-item group cursor-pointer ${item.completed ? 'opacity-60' : ''}`}>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                item.completed
                  ? 'bg-secondary border-secondary'
                  : 'border-text-muted group-hover:border-primary'
              }`}>
                {item.completed && <FiCheck size={12} className="text-bg-dark" strokeWidth={3} />}
              </div>
              <div className="flex-1 min-w-0 ml-3">
                <p className={`text-sm font-medium ${item.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                  {item.label}
                </p>
                <p className="text-[10px] text-text-muted truncate">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
