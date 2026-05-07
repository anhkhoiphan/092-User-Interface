import React from 'react';
import { FiAlertCircle, FiMessageSquare, FiBook, FiActivity, FiCheckCircle } from 'react-icons/fi';

const SignalChip = ({ source, type, label }) => {
  const isRecovered = type?.startsWith('recovered:');
  const cleanType = isRecovered ? type.replace('recovered:', '') : type;
  const displayLabel = label || cleanType;

  const getIcon = () => {
    if (isRecovered) return <FiCheckCircle size={11} />;
    switch (source) {
      case 'AGENT': return <FiActivity size={11} />;
      case 'CHAT': return <FiMessageSquare size={11} />;
      case 'LMS': return <FiBook size={11} />;
      default: return <FiAlertCircle size={11} />;
    }
  };

  const getStyle = () => {
    if (isRecovered) {
      return { 
        background: 'rgba(16, 185, 129, 0.08)', 
        color: 'var(--ta-green)', 
        borderColor: 'rgba(16, 185, 129, 0.2)' 
      };
    }
    switch (source) {
      case 'AGENT': return { background: 'rgba(124, 58, 237, 0.08)', color: 'var(--ta-accent)', borderColor: 'rgba(124, 58, 237, 0.2)' };
      case 'CHAT': return { background: 'rgba(59, 130, 246, 0.08)', color: 'var(--ta-blue)', borderColor: 'rgba(59, 130, 246, 0.2)' };
      case 'LMS': return { background: 'rgba(245, 158, 11, 0.08)', color: 'var(--ta-amber)', borderColor: 'rgba(245, 158, 11, 0.2)' };
      default: return { background: 'var(--ta-bg3)', color: 'var(--ta-text3)', borderColor: 'var(--ta-border)' };
    }
  };

  return (
    <span className="ta-signal-chip" style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 10px',
      borderRadius: '20px',
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
