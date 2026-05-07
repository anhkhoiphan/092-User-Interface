import React from 'react';
import { FiClock, FiMessageSquare, FiCheckCircle, FiTrendingUp, FiTrendingDown, FiUser } from 'react-icons/fi';
import SignalChip from './SignalChip';

const RiskCard = ({ student, spaceName, onResolve, onGetContext, formatOfflineTime, getRiskColor, getHomeworkBadge }) => {
  const score = student.metadata?.score || (student.level === 'critical' ? 5 : 2);
  const signals = student.metadata?.signals || [];
  const lastDelta = student.metadata?.last_signal?.delta || 0;
  const riskColor = getRiskColor(score);

  return (
    <div className="ta-list-row" style={{ padding: '20px 24px' }}>
      {/* Avatar with Status Ring */}
      <div style={{ position: 'relative' }}>
        <img 
          src={student.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${student.profiles?.display_name || 'Student'}&background=random&color=fff`} 
          style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '14px', 
            objectFit: 'cover',
            border: `2px solid ${riskColor}33`
          }} 
          alt={student.profiles?.display_name} 
        />
        <div style={{ 
          position: 'absolute', 
          bottom: '-2px', 
          right: '-2px', 
          width: '14px', 
          height: '14px', 
          borderRadius: '50%', 
          background: riskColor,
          border: '2px solid var(--ta-bg2)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}></div>
      </div>

      <div className="cell-info" style={{ flex: 1 }}>
        <div className="cell-name" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ta-text)' }}>
            {student.profiles?.display_name || 'Học viên'}
          </span>
          <span style={{ 
            fontSize: '10px', 
            background: 'var(--ta-bg3)', 
            color: 'var(--ta-text3)', 
            padding: '2px 10px', 
            borderRadius: '20px', 
            fontWeight: 700,
            border: '1px solid var(--ta-border)',
            textTransform: 'uppercase'
          }}>
            {spaceName}
          </span>
          
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '11px', fontWeight: 800, color: riskColor,
            background: riskColor + '11', padding: '3px 10px', borderRadius: '6px',
            border: `1px solid ${riskColor}22`
          }}>
            SCORE: {score}
            {lastDelta > 0 && <FiTrendingUp size={14} />}
            {lastDelta < 0 && <FiTrendingDown size={14} style={{ color: 'var(--ta-green)' }} />}
          </div>
          
          {getHomeworkBadge && getHomeworkBadge(student.homework_status)}
        </div>
        
        <div className="cell-sub" style={{ color: 'var(--ta-text3)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiClock size={14} /> {student.reason}
          </span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span style={{ fontSize: '12px' }}>Offline: {formatOfflineTime(student)}</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          {signals.map((sig, idx) => (
            <SignalChip key={idx} source={student.metadata?.last_signal?.type === sig ? student.metadata?.last_signal?.source : 'CHAT'} type={sig} />
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="ta-btn" style={{ 
          background: 'var(--ta-accent-bg)', 
          color: 'var(--ta-accent)', 
          border: '1px solid var(--ta-accent)33' 
        }} onClick={() => onGetContext(student.id, student.space_id)}>
          <FiMessageSquare style={{ marginRight: '8px' }} /> Soạn tin
        </button>
        <button className="ta-btn" style={{ 
          background: 'rgba(16, 185, 129, 0.1)', 
          color: 'var(--ta-green)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }} onClick={() => onResolve(student.id, student.space_id)}>
          <FiCheckCircle style={{ marginRight: '8px' }} /> Đã giải quyết
        </button>
      </div>
    </div>
  );
};

export default RiskCard;
