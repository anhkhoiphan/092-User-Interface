import React from 'react';
import { FiUploadCloud, FiRefreshCw, FiCheckCircle, FiChevronRight, FiCpu, FiFileText, FiList, FiCheckSquare, FiSend, FiClock, FiLayers } from 'react-icons/fi';

const RecapWorkflow = ({ 
  currentStep, 
  uploading, 
  uploadedFile, 
  handleFileUpload, 
  startAiAnalysis, 
  aiPreview, 
  sendTime, 
  setSendTime, 
  scheduleDate, 
  setScheduleDate, 
  handleApproveSummary,
  handleScheduleSummary,
  setCurrentStep,
  setAiPreview
}) => {
  return (
    <div className="ta-card" style={{ border: 'none', background: 'transparent' }}>
      {/* Premium Step Indicator */}
      <div style={{ 
        display: 'flex', 
        background: 'var(--ta-bg2)', 
        borderRadius: '16px', 
        padding: '8px', 
        marginBottom: '30px',
        border: '1px solid var(--ta-border)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        {['Tài liệu nguồn', 'AI Phân tích', 'Phê duyệt & Đăng'].map((step, idx) => {
          const isActive = currentStep === idx + 1;
          const isDone = currentStep > idx + 1;
          return (
            <div key={idx} style={{
              flex: 1, 
              padding: '12px 16px', 
              textAlign: 'center', 
              fontSize: '13px', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: isActive ? 'linear-gradient(135deg, var(--ta-accent), #8b5cf6)' : 'transparent',
              color: isActive ? 'white' : (isDone ? 'var(--ta-accent)' : 'var(--ta-text3)'),
              fontWeight: isActive ? 700 : 500,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: isDone ? 'pointer' : 'default',
              boxShadow: isActive ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none'
            }} onClick={() => isDone && setCurrentStep(idx + 1)}>
              <span style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: isActive ? 'rgba(255,255,255,0.2)' : (isDone ? 'var(--ta-accent-bg)' : 'rgba(255,255,255,0.05)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px'
              }}>
                {isDone ? <FiCheckCircle size={14} /> : idx + 1}
              </span>
              <span className="hide-mobile">{step}</span>
            </div>
          );
        })}
      </div>
      
      <div className="animate-fade">
        {currentStep === 1 && (
          <div className="ta-card" style={{ padding: '40px', background: 'var(--ta-bg2)', border: '1px solid var(--ta-border)' }}>
            <div 
              className="upload-zone-premium" 
              style={{ 
                border: '2px dashed var(--ta-border2)', 
                background: uploadedFile ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)', 
                borderRadius: '24px',
                padding: '60px 40px',
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center', 
                cursor: 'pointer',
                transition: '0.3s'
              }}
              onClick={() => document.getElementById('slide-upload').click()}
            >
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                background: 'var(--ta-accent-bg)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '20px',
                color: 'var(--ta-accent)',
                boxShadow: '0 0 0 10px rgba(124, 58, 237, 0.05)'
              }}>
                {uploading ? <FiRefreshCw className="spin" size={32} /> : 
                 uploadedFile ? <FiCheckCircle size={32} /> :
                 <FiUploadCloud size={32} />}
              </div>
              
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                {uploadedFile ? uploadedFile.filename : 'Tải lên Slide bài giảng'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--ta-text3)', textAlign: 'center', maxWidth: '400px' }}>
                {uploadedFile ? 'Tệp đã sẵn sàng để phân tích' : 'Kéo thả hoặc nhấn để chọn tệp bài giảng (PDF, PNG, JPG). AI sẽ kết hợp nội dung Slide với Chat Log để tạo bản tóm tắt hoàn chỉnh.'}
              </p>
              <input type="file" style={{ display: 'none' }} id="slide-upload" accept=".pdf,image/*" onChange={handleFileUpload} />
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              <button 
                className="vibrant-btn" 
                style={{ minWidth: '280px', height: '54px', fontSize: '15px', borderRadius: '16px' }}
                onClick={startAiAnalysis}
                disabled={!uploadedFile || uploading}
              >
                Tiến hành phân tích bằng AI <FiChevronRight style={{ marginLeft: '10px' }} />
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="ta-card" style={{ padding: '80px 40px', background: 'var(--ta-bg2)', textAlign: 'center', border: '1px solid var(--ta-border)' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 30px' }}>
               <div className="pulse-ring" style={{ position: 'absolute', inset: 0, border: '2px solid var(--ta-accent)', borderRadius: '50%', opacity: 0.3 }}></div>
               <div style={{ 
                 position: 'absolute', inset: '10px', 
                 background: 'var(--ta-accent-bg)', borderRadius: '50%', 
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 color: 'var(--ta-accent)'
               }}>
                 <FiCpu className="spin-slow" size={48} />
               </div>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>AI đang "thẩm thấu" kiến thức...</h2>
            <p style={{ color: 'var(--ta-text3)', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
              Trợ lý AI đang kết hợp nội dung Slide bài giảng cùng với các thảo luận quan trọng trong Chat Log để soạn thảo bản Recap chất lượng nhất.
            </p>
          </div>
        )}

        {currentStep === 3 && aiPreview && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
            <div className="ta-card" style={{ padding: '30px', background: 'var(--ta-bg2)', border: '1px solid var(--ta-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ta-accent)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                  Nội dung bản thảo tóm tắt
                </label>
                <span style={{ fontSize: '11px', color: 'var(--ta-text3)' }}>{aiPreview.content?.length || 0} ký tự</span>
              </div>
              <textarea 
                className="ta-input" 
                style={{ 
                  width: '100%', 
                  minHeight: '500px', 
                  padding: '24px', 
                  lineHeight: '1.8', 
                  fontSize: '15px',
                  background: 'var(--ta-bg3)',
                  border: '1px solid var(--ta-border2)',
                  borderRadius: '16px',
                  color: 'var(--ta-text2)'
                }}
                value={aiPreview.content}
                onChange={(e) => setAiPreview({ ...aiPreview, content: e.target.value })}
                placeholder="Nội dung tóm tắt sẽ xuất hiện ở đây..."
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="ta-card" style={{ padding: '24px', background: 'var(--ta-bg2)', border: '1px solid var(--ta-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--ta-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiCheckSquare />
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Quyết định lớp học</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {aiPreview.metadata?.decisions?.length > 0 ? aiPreview.metadata.decisions.map((d, i) => (
                    <div key={i} style={{ 
                      fontSize: '13px', 
                      padding: '12px', 
                      background: 'var(--ta-bg3)', 
                      borderRadius: '10px',
                      borderLeft: '3px solid var(--ta-green)',
                      color: 'var(--ta-text2)'
                    }}>
                      {d.content}
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed var(--ta-border)', borderRadius: '10px', color: 'var(--ta-text3)', fontSize: '12px' }}>
                      Không ghi nhận quyết định mới
                    </div>
                  )}
                </div>
              </div>

              <div className="ta-card" style={{ padding: '24px', background: 'var(--ta-bg2)', border: '1px solid var(--ta-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--ta-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiList />
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Phân công công việc</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {aiPreview.metadata?.tasks?.length > 0 ? aiPreview.metadata.tasks.map((t, i) => (
                    <div key={i} style={{ 
                      fontSize: '13px', 
                      padding: '12px', 
                      background: 'var(--ta-bg3)', 
                      borderRadius: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: 'var(--ta-text2)' }}>{t.task}</span>
                      <span style={{ 
                        fontSize: '11px', 
                        padding: '2px 8px', 
                        background: 'var(--ta-accent-bg)', 
                        color: 'var(--ta-accent)', 
                        borderRadius: '4px',
                        fontWeight: 700 
                      }}>@{t.assignee}</span>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed var(--ta-border)', borderRadius: '10px', color: 'var(--ta-text3)', fontSize: '12px' }}>
                      Không có task mới được giao
                    </div>
                  )}
                </div>
              </div>

              <div className="ta-card" style={{ padding: '24px', background: 'linear-gradient(135deg, var(--ta-bg2), var(--ta-bg3))', border: '1px solid var(--ta-accent)33' }}>
                 <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiClock style={{ color: 'var(--ta-accent)' }} /> Tùy chọn thời gian gửi
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div 
                      onClick={() => setSendTime('now')}
                      style={{ 
                        padding: '12px 16px', 
                        borderRadius: '12px', 
                        background: sendTime === 'now' ? 'var(--ta-accent-bg)' : 'transparent',
                        border: `1px solid ${sendTime === 'now' ? 'var(--ta-accent)' : 'var(--ta-border)'}`,
                        cursor: 'pointer',
                        transition: '0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--ta-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {sendTime === 'now' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ta-accent)' }}></div>}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: sendTime === 'now' ? 700 : 500 }}>Gửi ngay bây giờ</span>
                    </div>

                    <div 
                      onClick={() => setSendTime('schedule')}
                      style={{ 
                        padding: '12px 16px', 
                        borderRadius: '12px', 
                        background: sendTime === 'schedule' ? 'var(--ta-accent-bg)' : 'transparent',
                        border: `1px solid ${sendTime === 'schedule' ? 'var(--ta-accent)' : 'var(--ta-border)'}`,
                        cursor: 'pointer',
                        transition: '0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--ta-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {sendTime === 'schedule' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ta-accent)' }}></div>}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: sendTime === 'schedule' ? 700 : 500 }}>Đặt lịch gửi</span>
                    </div>

                    {sendTime === 'schedule' && (
                      <div className="animate-fade" style={{ marginTop: '8px' }}>
                        <input 
                          type="datetime-local" 
                          className="ta-input" 
                          style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '13px' }}
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                        />
                      </div>
                    )}
                 </div>

                 <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sendTime === 'now' ? (
                      <button className="vibrant-btn" style={{ height: '50px', borderRadius: '12px', fontSize: '14px' }} onClick={() => handleApproveSummary(aiPreview.id, aiPreview.space_id)}>
                        Phê duyệt & Đăng ngay <FiSend style={{ marginLeft: '8px' }} />
                      </button>
                    ) : (
                      <button className="vibrant-btn" style={{ 
                        height: '50px', 
                        borderRadius: '12px', 
                        fontSize: '14px',
                        background: 'linear-gradient(135deg, var(--ta-blue), var(--ta-purple))' 
                      }} 
                        onClick={() => handleScheduleSummary(aiPreview.id, aiPreview.space_id, scheduleDate)}
                        disabled={!scheduleDate}
                      >
                        Xác nhận đặt lịch <FiClock style={{ marginLeft: '8px' }} />
                      </button>
                    )}
                    <button className="ta-btn" style={{ height: '44px', borderRadius: '12px', fontSize: '13px', background: 'transparent', border: '1px solid var(--ta-border)' }} onClick={() => setCurrentStep(1)}>
                      Hủy và làm lại
                    </button>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecapWorkflow;
