import React, { useState } from 'react';
import { FiMessageSquare, FiSend, FiClock, FiCpu, FiChevronRight, FiCheckCircle, FiEdit3, FiRefreshCw } from 'react-icons/fi';

const AnnouncementWorkflow = ({ 
  onGenerate, 
  loading, 
  aiPreview, 
  setAiPreview, 
  handleApprove, 
  handleSchedule,
  sendTime,
  setSendTime,
  scheduleDate,
  setScheduleDate
}) => {
  const [purpose, setPurpose] = useState('attendance');
  const [context, setContext] = useState('');

  const purposes = [
    { id: 'attendance', label: 'Điểm danh', icon: '📝' },
    { id: 'homework', label: 'Yêu cầu nộp bài', icon: '📚' },
    { id: 'exam', label: 'Nhắc lịch thi', icon: '🎯' },
    { id: 'general', label: 'Thông báo chung', icon: '📢' }
  ];

  if (aiPreview) {
    return (
      <div className="animate-fade">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          <div className="preview-section">
            <div style={{ 
              background: 'var(--ta-bg2)', borderRadius: '20px', border: '1px solid var(--ta-border2)', 
              overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              position: 'relative'
            }}>
              <div style={{ 
                padding: '18px 25px', borderBottom: '1px solid var(--ta-border2)', 
                background: 'linear-gradient(to right, var(--ta-bg3), var(--ta-bg2))', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--ta-amber)', boxShadow: '0 0 10px var(--ta-amber)' }}></div>
                   <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ta-text)', letterSpacing: '0.5px' }}>BẢN THẢO THÔNG BÁO AI</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--ta-text3)', background: 'var(--ta-bg4)', padding: '4px 10px', borderRadius: '6px' }}>{aiPreview.content.length} ký tự</span>
              </div>
              <textarea 
                className="ta-input" 
                style={{ 
                  width: '100%', minHeight: '400px', padding: '30px', lineHeight: '1.8', 
                  border: 'none', background: 'transparent', fontSize: '15px', color: 'var(--ta-text)',
                  outline: 'none', resize: 'none'
                }}
                value={aiPreview.content}
                onChange={(e) => setAiPreview({ ...aiPreview, content: e.target.value })}
              />
              <div style={{ padding: '15px 30px', background: 'rgba(0,0,0,0.2)', fontSize: '12px', color: 'var(--ta-text3)', display: 'flex', gap: '20px' }}>
                 <span>✨ AI đã tối ưu nội dung cho phòng Thông Báo</span>
                 <span>📝 Bạn có thể chỉnh sửa trực tiếp phía trên</span>
              </div>
            </div>
          </div>
          
          <div className="options-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="ta-card" style={{ 
              padding: '25px', background: 'var(--ta-bg3)', border: '1px solid var(--ta-amber-border)',
              borderRadius: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
            }}>
               <h4 style={{ margin: '0 0 25px 0', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: 700 }}>
                  <FiClock color="var(--ta-amber)" /> THỜI GIAN GỬI
               </h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <label style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', 
                    padding: '15px', borderRadius: '12px', background: sendTime === 'now' ? 'var(--ta-amber-bg)' : 'var(--ta-bg4)',
                    border: '1px solid', borderColor: sendTime === 'now' ? 'var(--ta-amber)' : 'transparent',
                    transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    <input type="radio" name="annSendTime" checked={sendTime === 'now'} onChange={() => setSendTime('now')} /> Gửi ngay lập tức
                  </label>
                  <label style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px',
                    padding: '15px', borderRadius: '12px', background: sendTime === 'schedule' ? 'var(--ta-blue-bg)' : 'var(--ta-bg4)',
                    border: '1px solid', borderColor: sendTime === 'schedule' ? 'var(--ta-blue)' : 'transparent',
                    transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    <input type="radio" name="annSendTime" checked={sendTime === 'schedule'} onChange={() => setSendTime('schedule')} /> Đặt lịch gửi
                  </label>
                  
                  {sendTime === 'schedule' && (
                    <div className="animate-fade" style={{ marginTop: '5px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--ta-text2)', marginBottom: '10px', display: 'block', fontWeight: 600 }}>Chọn thời điểm đăng bài</label>
                      <input 
                        type="datetime-local" 
                        className="ta-input" 
                        style={{ width: '100%', padding: '12px', borderRadius: '8px' }}
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                      />
                    </div>
                  )}
               </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sendTime === 'now' ? (
                <button className="vibrant-btn" style={{ 
                  width: '100%', background: 'linear-gradient(135deg, var(--ta-amber), #fbbf24)', 
                  padding: '16px', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
                  boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)'
                }} onClick={() => handleApprove(aiPreview.id, aiPreview.space_id)}>
                  PHÊ DUYỆT & ĐĂNG NGAY <FiSend style={{ marginLeft: '10px' }} />
                </button>
              ) : (
                <button className="vibrant-btn" style={{ 
                  width: '100%', background: 'linear-gradient(135deg, var(--ta-blue), var(--ta-purple))', 
                  padding: '16px', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
                  boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                }} 
                  onClick={() => handleSchedule(aiPreview.id, aiPreview.space_id, scheduleDate)}
                  disabled={!scheduleDate}
                >
                  XÁC NHẬN ĐẶT LỊCH <FiClock style={{ marginLeft: '10px' }} />
                </button>
              )}
              <button className="ta-btn" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 600 }} onClick={() => setAiPreview(null)}>Hủy bỏ bản thảo này</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ta-card" style={{ padding: '50px', borderTop: '6px solid var(--ta-amber)', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '45px' }}>
        <div style={{ 
          width: '60px', height: '60px', borderRadius: '18px', 
          background: 'linear-gradient(135deg, var(--ta-amber-bg), rgba(245, 158, 11, 0.05))', 
          color: 'var(--ta-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 0 15px rgba(245, 158, 11, 0.1)'
        }}>
          <FiMessageSquare size={28} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>Trung tâm Thông báo AI</h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--ta-text3)', maxWidth: '500px', lineHeight: '1.5' }}>
            Hệ thống hỗ trợ TA soạn thảo nội dung truyền thông lớp học chuyên nghiệp dựa trên các mục đích cụ thể.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '50px' }}>
        <div className="purpose-selector">
          <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ta-text3)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px', display: 'block' }}>1. MỤC ĐÍCH THÔNG BÁO</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {purposes.map(p => (
              <div 
                key={p.id} 
                onClick={() => setPurpose(p.id)}
                style={{
                  padding: '18px 25px', borderRadius: '15px', cursor: 'pointer',
                  border: '1px solid', borderColor: purpose === p.id ? 'var(--ta-amber)' : 'var(--ta-border)',
                  background: purpose === p.id ? 'var(--ta-amber-bg)' : 'var(--ta-bg3)',
                  display: 'flex', alignItems: 'center', gap: '18px', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: purpose === p.id ? '0 10px 20px rgba(245, 158, 11, 0.15)' : 'none',
                  transform: purpose === p.id ? 'translateX(5px)' : 'none'
                }}
              >
                <div style={{ 
                  fontSize: '24px', width: '40px', height: '40px', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)'
                }}>{p.icon}</div>
                <span style={{ fontWeight: purpose === p.id ? 700 : 500, fontSize: '15px', color: purpose === p.id ? 'var(--ta-text)' : 'var(--ta-text2)' }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="metadata-input">
          <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ta-text3)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px', display: 'block' }}>2. NỘI DUNG & NGỮ CẢNH</label>
          <div style={{ background: 'var(--ta-bg2)', borderRadius: '20px', padding: '30px', border: '1px solid var(--ta-border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
            <textarea 
              className="ta-input"
              style={{ width: '100%', height: '220px', padding: '10px', fontSize: '15px', background: 'transparent', border: 'none', resize: 'none', lineHeight: '1.6', color: 'var(--ta-text)' }}
              placeholder="Nhập các thông tin quan trọng (thời gian, địa điểm, yêu cầu cụ thể)... AI sẽ tự động hoàn thiện văn phong cho bạn."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', paddingTop: '25px', borderTop: '1px solid var(--ta-border)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ta-text3)', fontSize: '13px' }}>
                  <FiCpu size={16} color="var(--ta-amber)" />
                  <span>AI đã sẵn sàng soạn thảo</span>
               </div>
               <button 
                  className="vibrant-btn" 
                  style={{ 
                    padding: '14px 45px', background: 'linear-gradient(135deg, var(--ta-amber), #fbbf24)', 
                    borderRadius: '12px', fontWeight: 700, fontSize: '15px',
                    boxShadow: '0 10px 20px rgba(245, 158, 11, 0.2)'
                  }}
                  onClick={() => onGenerate(purpose, context)}
                  disabled={loading || !context}
                >
                  {loading ? <><FiRefreshCw className="spin" style={{ marginRight: '10px' }} /> ĐANG SOẠN...</> : <>SOẠN THẢO NGAY <FiChevronRight style={{ marginLeft: '10px' }} /></>}
                </button>
            </div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
             {['Thông báo 19h tối nay', 'Nhắc nộp bài tập Day 5', 'Lịch thi giữa khóa'].map(tag => (
               <span key={tag} className="ta-badge" style={{ cursor: 'pointer', background: 'var(--ta-bg4)', padding: '6px 12px' }} onClick={() => setContext(tag)}>{tag}</span>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementWorkflow;
