import React from 'react';
import { FiAlertCircle, FiMessageSquare, FiBook, FiActivity } from 'react-icons/fi';

const SignalChip = ({ source, type, label }) => {
  const getStyle = () => {
    switch(source) {
      case 'CHAT': return { background: 'var(--ta-blue-bg)', color: 'var(--ta-blue)', borderColor: 'var(--ta-blue)' };
      case 'ATTENDANCE': return { background: 'var(--ta-amber-bg)', color: 'var(--ta-amber)', borderColor: 'var(--ta-amber)' };
      case 'HOMEWORK': return { background: 'var(--ta-purple-bg)', color: 'var(--ta-purple)', borderColor: 'var(--ta-purple)' };
      default: return { background: 'var(--hover-primary)', color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' };
    }
  };

  const getIcon = () => {
    switch(source) {
      case 'CHAT': return <FiMessageSquare size={10} />;
      case 'HOMEWORK': return <FiBook size={10} />;
      case 'ATTENDANCE': return <FiActivity size={10} />;
      default: return <FiAlertCircle size={10} />;
    }
  };

  const displayLabel = label || type || source;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 700,
      border: '1px solid',
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
      ...getStyle()
    }}>
      {getIcon()} {displayLabel}
    </span>
  );
};

export default SignalChip;
