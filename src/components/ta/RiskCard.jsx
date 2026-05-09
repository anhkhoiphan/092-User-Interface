import React from 'react';
import { FiClock, FiMessageSquare, FiCheckCircle, FiUser } from 'react-icons/fi';
import SignalChip from './SignalChip';

const RiskCard = ({ student, spaceName, onResolve, onGetContext, formatOfflineTime, getRiskColor }) => {
  const score = student.metadata?.score || (student.level === 'critical' ? 5 : 2);
  const riskColor = getRiskColor(score, student.level);
  const signals = student.metadata?.signals || [];

  return (
    <div className={`risk-card-container ${student.level || 'normal'}`} style={{ fontFamily: 'inherit' }}>
      {/* Cột Avatar */}
      <div style={{ width: '40px', position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <div style={{ 
          width: '32px', height: '32px', borderRadius: '8px', 
          background: 'var(--primary-active)', color: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <FiUser size={18} />
        </div>
        <div style={{ 
          position: 'absolute', bottom: '0', right: '4px', 
          width: '10px', height: '10px', borderRadius: '50%', 
          background: riskColor, border: '2px solid var(--bg-surface-secondary)',
        }}></div>
      </div>

      {/* Cột Học viên */}
      <div style={{ flex: 1.5, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
          {student.profiles?.display_name || 'Học viên'}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'inherit' }}>{spaceName}</div>
      </div>

      {/* Cột Tín hiệu Rủi ro */}
      <div style={{ flex: 2, minWidth: 0 }}>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
          {student.reason}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {signals.slice(0, 2).map((sig, idx) => (
            <SignalChip key={idx} source="CHAT" type={sig} />
          ))}
        </div>
      </div>

      {/* Thời gian Ngoại tuyến */}
      <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'inherit' }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
          <FiClock size={12} /> {formatOfflineTime(student)}
        </div>
      </div>
      
      {/* Cột Thao tác */}
      <div style={{ flex: 1.5, display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button className="ta-btn" style={{ 
          padding: '6px 10px', background: 'var(--ta-blue-bg)', color: 'var(--ta-blue)', border: 'none', fontFamily: 'inherit'
        }} onClick={() => onGetContext(student.id, student.space_id)}>
          <FiMessageSquare /> Soạn tin
        </button>
        <button className="ta-btn" style={{ padding: '6px 10px', fontFamily: 'inherit' }} onClick={() => onResolve(student.id, student.space_id)} title="Đánh dấu đã giải quyết">
          <FiCheckCircle />
        </button>
      </div>
    </div>
  );
};

export default RiskCard;
