import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { staggerContainer, staggerItem } from '../../animations/variants';

const OptionButton = ({ option, selected, correct, incorrect, disabled, onSelect }) => {
  const base = 'w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer group';
  const getStyle = () => {
    if (correct) return 'border-success-400 bg-success-50 text-success-800';
    if (incorrect) return 'border-danger-400 bg-danger-50 text-danger-800';
    if (selected) return 'border-primary-400 bg-primary-50 text-primary-800';
    return 'border-surface-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 text-surface-700';
  };

  return (
    <motion.button
      variants={staggerItem}
      onClick={() => !disabled && onSelect(option.id)}
      disabled={disabled}
      className={`${base} ${getStyle()}`}
      whileHover={!disabled ? { scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.99 } : {}}
    >
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold text-xs transition-all ${
        correct ? 'border-success-500 bg-success-500 text-white' :
        incorrect ? 'border-danger-500 bg-danger-500 text-white' :
        selected ? 'border-primary-500 bg-primary-500 text-white' :
        'border-surface-300 text-surface-400 group-hover:border-primary-400'
      }`}>
        {correct ? <Check size={12} /> : incorrect ? <X size={12} /> : option.id.toUpperCase()}
      </div>
      <span className="text-sm font-medium leading-snug">{option.text}</span>
    </motion.button>
  );
};

const MCQTask = ({ task, answer, onChange, submitted, feedback }) => {
  const isMulti = task.type === 'mcq_multi';

  const handleSelect = (optionId) => {
    if (isMulti) {
      const current = Array.isArray(answer) ? answer : [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      onChange(updated);
    } else {
      onChange(optionId);
    }
  };

  const isSelected = (id) => isMulti ? (Array.isArray(answer) && answer.includes(id)) : answer === id;
  const isCorrect = (id) => submitted && (isMulti ? task.correctAnswers?.includes(id) : task.correctAnswer === id);
  const isIncorrect = (id) => submitted && isSelected(id) && !isCorrect(id);

  return (
    <div>
      <h3 className="text-base font-bold text-surface-800 mb-4 leading-relaxed">{task.question}</h3>
      {isMulti && (
        <p className="text-xs text-surface-400 font-medium mb-3 flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-surface-200 flex items-center justify-center text-surface-500">✓</span>
          Select all that apply
        </p>
      )}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2.5">
        {task.options.map((option) => (
          <OptionButton
            key={option.id}
            option={option}
            selected={isSelected(option.id)}
            correct={isCorrect(option.id)}
            incorrect={isIncorrect(option.id)}
            disabled={submitted}
            onSelect={handleSelect}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default MCQTask;
