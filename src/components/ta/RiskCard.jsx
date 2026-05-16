import React, { useState } from 'react';
import { FiClock, FiMessageSquare, FiCheckCircle, FiUser, FiBarChart2, FiInfo, FiZap } from 'react-icons/fi';

const RiskCard = ({ student, spaceName, onResolve, onGetContext, formatOfflineTime }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const score = student.metadata?.score || 0;
  const level = student.level || (score >= 6 ? 'critical' : score >= 3 ? 'warning' : 'safe');

  const signals = student.metadata?.signal_details || student.metadata?.signals || {};
  const absencePoints = signals.absence_points || 0;
  const stuckPoints = signals.stuck_points || 0;
  const quizAvg = signals.quiz_avg_score !== undefined ? signals.quiz_avg_score : null;

  // Score breakdown from 3 sources - use nullish coalescing for missing fields
  const breakdown = student.score_breakdown || {};
  const lastSeenNormalized = breakdown.last_seen_normalized ?? 0;
  const fastApiNormalized = breakdown.fastapi_normalized ?? 0;
  const quizNormalized = breakdown.quiz_normalized ?? 0;

  const riskColor = level === 'critical' ? 'var(--ta-red)' : level === 'warning' ? 'var(--ta-amber)' : 'var(--ta-green)';
  const riskLabel = level === 'critical' ? 'Nghiêm trọng' : level === 'warning' ? 'Cần chú ý' : 'An toàn';

  const getScoreBarColor = (value, type) => {
    // Color gradient: green (low risk) → yellow → red (high risk)
    if (value < 3) return 'var(--ta-green)';
    if (value < 6) return 'var(--ta-amber)';
    return 'var(--ta-red)';
  };

  return (
    <div className={`risk-card-container ${level}`} style={{ fontFamily: 'inherit' }}>
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
      <div style={{ flex: 1.2, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
          {student.profiles?.display_name || 'Học viên'}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'inherit' }}>{spaceName}</div>
      </div>

      {/* Cột Risk Score & Level */}
      <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: riskColor, fontFamily: 'inherit' }}>
          {score.toFixed(1)}
        </div>
        <div style={{ fontSize: '10px', fontWeight: 600, color: riskColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {riskLabel}
        </div>
      </div>

      {/* Cột Chi tiết Tín hiệu */}
      <div style={{ flex: 2, minWidth: 0 }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: 'inherit' }}>
          {student.reason}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {absencePoints > 0 && (
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--ta-amber-bg)', color: 'var(--ta-amber)', fontWeight: 600 }}>
              <FiClock size={10} style={{ verticalAlign: 'middle', marginRight: '2px' }} />Vắng {Math.floor(student.hours_since_active || 0)}h ({absencePoints}đ)
            </span>
          )}
          {stuckPoints > 0 && (
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--ta-blue-bg)', color: 'var(--ta-blue)', fontWeight: 600 }}>
              <FiMessageSquare size={10} style={{ verticalAlign: 'middle', marginRight: '2px' }} />Stuck ({stuckPoints}đ)
            </span>
          )}
          {signals.unanswered_q_points > 0 && (
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--ta-purple-bg)', color: 'var(--ta-purple)', fontWeight: 600 }}>
              <FiMessageSquare size={10} style={{ verticalAlign: 'middle', marginRight: '2px' }} />Chưa trả lời ({signals.unanswered_q_points}đ)
            </span>
          )}
          {signals.frustration_points > 0 && (
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--ta-red-bg)', color: 'var(--ta-red)', fontWeight: 600 }}>
              <FiZap size={10} style={{ verticalAlign: 'middle', marginRight: '2px' }} />Frustration ({signals.frustration_points}đ)
            </span>
          )}
          {quizAvg !== null && quizAvg < 70 && (
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--ta-green-bg)', color: 'var(--ta-green)', fontWeight: 600 }}>
              <FiBarChart2 size={10} style={{ verticalAlign: 'middle', marginRight: '2px' }} />Quiz: {quizAvg.toFixed(0)}
            </span>
          )}
        </div>
      </div>

      {/* Cột Breakdown với Tooltip */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button
          className="ta-btn"
          onClick={() => setShowBreakdown(!showBreakdown)}
          style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}
          title="Xem chi tiết điểm"
        >
          <FiBarChart2 size={12} /> {showBreakdown ? 'Ẩn' : 'Chi tiết'}
        </button>

        {showBreakdown && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '60px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            padding: '12px',
            minWidth: '200px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 100,
            transform: 'translateX(-50%)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Chi tiết điểm số</div>

            {/* Last Seen */}
            <div style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                <span>Vắng mặt</span>
                <span>{lastSeenNormalized.toFixed(1)} / 10</span>
              </div>
              <div style={{ height: '6px', background: 'var(--border-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${lastSeenNormalized * 10}%`,
                  height: '100%',
                  background: getScoreBarColor(lastSeenNormalized, 'last_seen')
                }} />
              </div>
            </div>

            {/* FastAPI Signals */}
            <div style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                <span>Tín hiệu chat</span>
                <span>{fastApiNormalized.toFixed(1)} / 10</span>
              </div>
              <div style={{ height: '6px', background: 'var(--border-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${fastApiNormalized * 10}%`,
                  height: '100%',
                  background: getScoreBarColor(fastApiNormalized, 'fastapi')
                }} />
              </div>
            </div>

            {/* Quiz Score */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                <span>Điểm Quiz</span>
                <span>{quizNormalized.toFixed(1)} / 10</span>
              </div>
              <div style={{ height: '6px', background: 'var(--border-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${quizNormalized * 10}%`,
                  height: '100%',
                  background: getScoreBarColor(quizNormalized, 'quiz')
                }} />
              </div>
            </div>

            <div style={{
              borderTop: '1px solid var(--border-primary)',
              paddingTop: '8px',
              display: 'flex', justifyContent: 'space-between',
              fontSize: '11px', fontWeight: 600
            }}>
              <span>Tổng điểm</span>
              <span style={{ color: riskColor }}>{score.toFixed(1)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Thời gian Ngoại tuyến */}
      <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FiClock size={12} />
          {formatOfflineTime(student)}
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
