import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const SortableItem = ({ item, index, submitted, isCorrect }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 'auto' };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 bg-white transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${
        submitted
          ? isCorrect
            ? 'border-success-400 bg-success-50'
            : 'border-danger-400 bg-danger-50'
          : 'border-surface-200 hover:border-primary-300 hover:shadow-card'
      }`}
    >
      <span className="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center text-xs font-black text-surface-400 flex-shrink-0">
        {index + 1}
      </span>
      <span className="flex-1 text-sm font-medium text-surface-700">{item.text}</span>
      {submitted ? (
        isCorrect ? <Check size={16} className="text-success-500 flex-shrink-0" /> : <X size={16} className="text-danger-500 flex-shrink-0" />
      ) : (
        <button {...attributes} {...listeners} className="p-1 text-surface-300 hover:text-surface-500 cursor-grab active:cursor-grabbing flex-shrink-0">
          <GripVertical size={16} />
        </button>
      )}
    </div>
  );
};

const DragArrangeTask = ({ task, answer, onChange, submitted }) => {
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const initial = task.blocks.map((b) => ({ ...b }));
    if (Array.isArray(answer) && answer.length === initial.length) {
      const ordered = answer.map((id) => initial.find((b) => b.id === id)).filter(Boolean);
      setItems(ordered);
    } else {
      setItems(initial);
    }
  }, [task.id]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (active.id !== over?.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        const next = arrayMove(prev, oldIndex, newIndex);
        onChange(next.map((i) => i.id));
        return next;
      });
    }
  };

  const activeItem = items.find((i) => i.id === activeId);

  return (
    <div>
      <h3 className="text-base font-bold text-surface-800 mb-2 leading-relaxed">{task.question}</h3>
      <p className="text-xs text-surface-400 font-medium mb-4 flex items-center gap-1.5">
        <GripVertical size={12} /> Drag blocks to reorder them
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy} disabled={submitted}>
          <motion.div className="space-y-2">
            {items.map((item, index) => (
              <SortableItem
                key={item.id}
                item={item}
                index={index}
                submitted={submitted}
                isCorrect={submitted && task.correctOrder[index] === item.id}
              />
            ))}
          </motion.div>
        </SortableContext>
        <DragOverlay>
          {activeItem && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-primary-400 bg-primary-50 shadow-glass-lg opacity-90">
              <span className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center text-xs font-black text-primary-600 flex-shrink-0">
                ⋮
              </span>
              <span className="flex-1 text-sm font-medium text-surface-700">{activeItem.text}</span>
              <GripVertical size={16} className="text-primary-400" />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default DragArrangeTask;
