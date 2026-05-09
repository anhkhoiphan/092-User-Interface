import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiAlertCircle, FiRefreshCw, FiFileText, FiActivity, FiSettings, 
  FiTrendingUp, FiSend, FiBarChart2, FiCpu, FiClock, FiTrash2, 
  FiLayers, FiFilter, FiEdit3, FiMessageSquare, FiUser, FiCheckCircle, FiCheck, FiX, FiChevronRight, FiCheckSquare, FiZap, FiRotateCcw, FiSave, FiChevronDown
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import taService from '../services/ta.service';

// New TA Components
import RiskCard from '../components/ta/RiskCard';
import RecapWorkflow from '../components/ta/RecapWorkflow';
import AnnouncementWorkflow from '../components/ta/AnnouncementWorkflow';
import AiComposeModal from '../components/ta/AiComposeModal';
import ScheduledQueueList from '../components/ta/ScheduledQueueList';

import './TADashboard.css';

const TADashboard = () => {
  console.log("[TADashboard] Render Start");

  const { user } = useSelector((state) => state.auth || {});
  const { spaces = [] } = useSelector((state) => state.space || {});
  
  const taSpaces = Array.isArray(spaces) ? spaces.filter(s => 
    s.owner_id === user?.id || s.role === 'owner' || s.role === 'admin'
  ) : [];
  
  const [atRiskList, setAtRiskList] = useState([]);
  const [summaryQueue, setSummaryQueue] = useState([]);
  const [actionLogs, setActionLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false); 
  const [isAnalyzing, setIsAnalyzing] = useState(false); 
  const [activeTab, setActiveTab] = useState('at-risk');
  const [selectedSpaceFilter, setSelectedSpaceFilter] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Metrics Calculation
  const criticalCount = atRiskList.filter(i => !i.is_resolved && (i.level === 'critical' || (i.metadata?.score || 0) >= 5)).length;
  const warningCount = atRiskList.filter(i => !i.is_resolved && (i.level === 'warning' || ((i.metadata?.score || 0) >= 2 && (i.metadata?.score || 0) < 5))).length;
  const resolvedCount = actionLogs.filter(l => l.action_type === 'dismissed_alert' || l.action_type === 'sent_dm').length;
  const timeSaved = actionLogs.length * 10; 

  const chartData = [
    { name: 'Nguy hiểm', value: criticalCount, color: 'var(--ta-red)' },
    { name: 'Cảnh báo', value: warningCount, color: 'var(--ta-amber)' },
    { name: 'Đã xử lý', value: resolvedCount, color: 'var(--ta-green)' },
  ];

  // Toast System
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // AI Flow State
  const [currentStep, setCurrentStep] = useState(1); 
  const [aiPreview, setAiPreview] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(''); 
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedSpaces, setSelectedSpaces] = useState([]);

  // AI Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState(null);

  // --- AI Config Logic ---
  const DEFAULT_CONFIG = {
    recap: { pronouns: "mình - các bạn", tone: "nhiệt huyết", structure: ["Nội dung chính"], useEmoji: true },
    announcement: { pronouns: "mình - các bạn", tone: "chuyên nghiệp", useEmoji: true },
    isHitlEnabled: true,
    instruction: "Trả lời ngắn gọn, súc tích, sử dụng bullet points để dễ đọc. Luôn có câu chào và câu kết thân thiện."
  };

  const [aiConfig, setAiConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('ta_ai_config_v6'); 
      if (!saved) return DEFAULT_CONFIG;
      const parsed = JSON.parse(saved);
      return parsed?.recap ? parsed : DEFAULT_CONFIG;
    } catch (e) { return DEFAULT_CONFIG; }
  });

  const [configDraft, setConfigDraft] = useState(aiConfig);

  const handleSaveConfig = () => {
    setAiConfig(configDraft);
    localStorage.setItem('ta_ai_config_v6', JSON.stringify(configDraft));
    addToast('Đã áp dụng cấu hình AI mới!');
  };

  const buildRecapPrompt = () => {
    const r = aiConfig?.recap || DEFAULT_CONFIG.recap;
    const inst = aiConfig?.instruction || DEFAULT_CONFIG.instruction;
    return `Hãy đóng vai một Trợ giảng (TA) ${r.tone}. Xưng hô "${r.pronouns}". Cấu trúc: ${(r.structure || []).join(', ')}. Hướng dẫn bổ sung: ${inst}`;
  };

  const buildAnnouncementPrompt = (purpose, context) => {
    const a = aiConfig?.announcement || DEFAULT_CONFIG.announcement;
    const inst = aiConfig?.instruction || DEFAULT_CONFIG.instruction;
    return `Thông báo: ${purpose}. Ngữ cảnh: ${context}. Xưng hô: "${a.pronouns}". Tone: ${a.tone}. Hướng dẫn bổ sung: ${inst}`;
  };

  const fetchData = async () => {
    if (taSpaces.length === 0) return;
    setLoading(true);
    try {
      const allAtRisk = [];
      const allQueue = [];
      const allLogs = [];
      await Promise.all(taSpaces.map(async (space) => {
        try { await taService.scanAtRisk(space.id); } catch (e) {}
        const [atRiskRes, queueRes, logsRes] = await Promise.allSettled([
          taService.getAtRiskList(space.id),
          taService.getSummaryQueue(space.id),
          taService.getActionLogs(space.id)
        ]);
        if (atRiskRes.status === 'fulfilled' && atRiskRes.value.success) {
          allAtRisk.push(...(atRiskRes.value.data || []).map(s => ({ ...s, space_id: space.id })));
        }
        if (queueRes.status === 'fulfilled' && queueRes.value.success) {
          allQueue.push(...(queueRes.value.data || []).map(q => ({ ...q, space_id: space.id })));
        }
        if (logsRes.status === 'fulfilled' && logsRes.value.success) {
          allLogs.push(...(logsRes.value.data || []));
        }
      }));
      
      const sortedAtRisk = allAtRisk.sort((a, b) => {
        const scoreA = a.metadata?.score || (a.level === 'critical' ? 5 : 2);
        const scoreB = b.metadata?.score || (b.level === 'critical' ? 5 : 2);
        return scoreB - scoreA;
      });

      setAtRiskList(sortedAtRisk);
      setSummaryQueue(allQueue);
      setActionLogs(allLogs);
    } catch (error) {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [taSpaces.length]);

  const handleResolveAlert = async (id, spaceId) => {
    try {
      const res = await taService.resolveAlert(id, spaceId);
      if (res.success) {
        setAtRiskList(prev => prev.filter(item => item.id !== id));
        addToast('Đã giải quyết');
      }
    } catch (error) {}
  };

  const handleApproveSummary = async (draftId, spaceId) => {
    setIsSending(true);
    try {
      if (aiPreview?.id === draftId) await taService.updateSummaryDraft(draftId, spaceId, { content: aiPreview.content });
      const res = await taService.approveSummary(draftId, spaceId);
      if (res.success) {
        addToast('Đã gửi bài!');
        fetchData();
        setAiPreview(null);
        setCurrentStep(1);
      }
    } catch (error) {} finally { setIsSending(false); }
  };

  const handleScheduleSummary = async (draftId, spaceId, scheduledAt) => {
    setIsSending(true);
    try {
      const res = await taService.scheduleSummary(draftId, spaceId, new Date(scheduledAt).toISOString());
      if (res.success) {
        addToast('Đã đặt lịch!');
        fetchData();
        setAiPreview(null);
        setCurrentStep(1);
      }
    } catch (error) {} finally { setIsSending(false); }
  };

  // --- Scheduled Queue Actions ---
  const handleEditScheduled = (item) => {
    setAiPreview(item);
    if (item.draft_type === 'lesson_recap') {
      setActiveTab('summary');
      setCurrentStep(3);
    } else {
      setActiveTab('announcements');
    }
    // Lăn lên đầu để sửa
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelSchedule = async (draftId, spaceId) => {
    try {
      setIsSending(true);
      const res = await taService.cancelSchedule(draftId, spaceId);
      if (res.success) {
        addToast('Đã hủy lịch gửi');
        fetchData();
      }
    } catch (error) {} finally { setIsSending(false); }
  };

  const handleBulkCancel = async (ids) => {
    try {
      setIsSending(true);
      await Promise.all(ids.map(id => {
        const item = summaryQueue.find(q => q.id === id);
        return taService.cancelSchedule(id, item.space_id);
      }));
      addToast(`Đã hủy ${ids.length} bài viết`);
      fetchData();
    } catch (error) {} finally { setIsSending(false); }
  };

  const handleBulkSendNow = async (ids) => {
    try {
      setIsSending(true);
      await Promise.all(ids.map(id => {
        const item = summaryQueue.find(q => q.id === id);
        return taService.approveSummary(id, item.space_id);
      }));
      addToast(`Đã gửi ${ids.length} bài viết ngay lập tức`);
      fetchData();
    } catch (error) {} finally { setIsSending(false); }
  };

  const handleRefineAi = async (refineInstruction) => {
    if (!aiPreview || !selectedSpaces.length) return;
    setIsAnalyzing(true);
    try {
      const prompt = `Đây là nội dung bản thảo hiện tại:\n---\n${aiPreview.content}\n---\nHãy sửa lại nội dung này theo yêu cầu sau: ${refineInstruction}. Giữ nguyên định dạng Markdown.`;
      const resAgent = await taService.callAgentChat(selectedSpaces[0], prompt, user?.display_name || 'TA');
      
      if (resAgent?.success && resAgent.answer) {
        const res = await taService.updateSummaryDraft(aiPreview.id, aiPreview.space_id, {
          content: resAgent.answer
        });
        if (res.success) {
          setAiPreview(res.data);
          addToast('Đã cập nhật bản thảo!');
        }
      }
    } catch (error) {
      addToast('Không thể hiệu chỉnh nội dung', 'error');
    } finally { setIsAnalyzing(false); }
  };

  const handleOpenCompose = async (snapshotId, spaceId) => {
    try {
      setLoading(true);
      const res = await taService.getAtRiskContext(snapshotId, spaceId);
      if (res.success) {
        setCurrentContext({ 
          id: snapshotId, 
          space_id: spaceId, 
          ...res.data,
          aiConfig: aiConfig,
          taName: user?.display_name || 'Trợ giảng'
        });
        setIsComposeOpen(true);
      }
    } catch (error) {} finally { setLoading(false); }
  };

  const handleAiSend = async (message) => {
    if (!currentContext) return;
    try {
      setLoading(true);
      const res = await taService.sendSmartMessage(currentContext.spaceId, {
        taId: user?.id, studentId: currentContext.student_info?.id,
        content: message, snapshotId: currentContext.id, spaceId: currentContext.spaceId
      });
      if (res.success) {
        setIsComposeOpen(false);
        handleResolveAlert(currentContext.id, currentContext.spaceId);
        addToast('Đã gửi tin nhắn!');
      }
    } catch (error) {} finally { setLoading(false); }
  };

  return (
    <div className="ta-dashboard-container">
      <div className="toast-container">
        {isSending && (
          <div className="toast-item animate-fade" style={{ borderLeftColor: 'var(--primary)', pointerEvents: 'auto' }}>
            <FiRefreshCw className="spin" color="var(--primary)" />
            <span>Đang thực hiện...</span>
          </div>
        )}
        {toasts.map(t => (
          <div key={t.id} className={`toast-item ${t.type} animate-fade`}>
            {t.type === 'success' ? <FiCheckCircle color="var(--ta-green)" /> : <FiAlertCircle color="var(--ta-red)" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <AiComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} context={currentContext} onSend={handleAiSend} isSending={loading} />

      <aside className="ta-internal-sidebar">
        <div className="sb-head">
          <div className="sb-title">TA Management Hub</div>
          <div className="sb-sub">{taSpaces.length} Lớp đang quản lý</div>
        </div>
        <div className="flex-1 flex flex-col gap-xs p-2">
          <button onClick={() => setActiveTab('at-risk')} className={`sb-item ${activeTab === 'at-risk' ? 'active' : ''}`}>
            <FiAlertCircle /> <span>Giám sát</span>
            {atRiskList.length > 0 && <span className="ta-badge badge-red ml-auto">{atRiskList.length}</span>}
          </button>
          <button onClick={() => { setActiveTab('summary'); setCurrentStep(1); setAiPreview(null); }} className={`sb-item ${activeTab === 'summary' ? 'active' : ''}`}>
            <FiFileText /> <span>Recap AI</span>
          </button>
          <button onClick={() => { setActiveTab('announcements'); setAiPreview(null); }} className={`sb-item ${activeTab === 'announcements' ? 'active' : ''}`}>
            <FiMessageSquare /> <span>Thông báo AI</span>
          </button>
          <button onClick={() => setActiveTab('logs')} className={`sb-item ${activeTab === 'logs' ? 'active' : ''}`}>
            <FiActivity /> <span>Nhật ký</span>
          </button>
        </div>
        <div className="mt-auto border-t border-primary/10 p-2">
          <button onClick={() => setActiveTab('settings')} className={`sb-item ${activeTab === 'settings' ? 'active' : ''}`}>
            <FiSettings /> <span>Cấu hình AI</span>
          </button>
        </div>
      </aside>

      <div className="ta-main-content">
        <header className="ta-header">
          <div className="ta-title-area">
             <h1>{activeTab === 'at-risk' ? 'Giám sát' : activeTab === 'summary' ? 'Recap AI' : activeTab === 'announcements' ? 'Thông báo AI' : 'Hệ thống'}</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {activeTab === 'settings' && (
              <button className="vibrant-btn" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={handleSaveConfig}>
                <FiSave /> Lưu thay đổi
              </button>
            )}
            <button className="ta-btn" onClick={fetchData} disabled={loading}><FiRefreshCw className={loading ? 'spin' : ''} /></button>
          </div>
        </header>

        <div className="ta-scroll-content" key={activeTab}>
          {activeTab === 'at-risk' && (
            <div className="animate-fade">
              <div className="metrics-grid">
                <div className="stat-card critical">
                  <span className="stat-label">Rủi ro Nghiêm trọng</span>
                  <div className="stat-value">{criticalCount} <span>học viên</span></div>
                </div>
                <div className="stat-card warning">
                  <span className="stat-label">Cần chú ý</span>
                  <div className="stat-value">{warningCount} <span>học viên</span></div>
                </div>
                <div className="stat-card success">
                  <span className="stat-label">Tiết kiệm thời gian</span>
                  <div className="stat-value">{timeSaved} <span>phút/tuần</span></div>
                </div>
              </div>

              <div className="monitoring-overview">
                <div className="chart-card">
                  <h4>TỔNG QUAN XỬ LÝ RỦI RO</h4>
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-primary)" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '12px', fontWeight: 600 }} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-primary)', borderRadius: '8px' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                          {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="chart-card" style={{ justifyContent: 'flex-start' }}>
                  <h4>BỘ LỌC LỚP HỌC</h4>
                  <div className="dropdown-custom">
                    <div className="dropdown-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FiLayers color="var(--primary)" />
                        <span>{selectedSpaceFilter === 'all' ? 'Tất cả lớp học' : taSpaces.find(s => s.id === selectedSpaceFilter)?.name}</span>
                      </div>
                      <FiChevronDown />
                    </div>
                    {isDropdownOpen && (
                      <div className="dropdown-menu">
                        <div className={`dropdown-item ${selectedSpaceFilter === 'all' ? 'active' : ''}`} onClick={() => { setSelectedSpaceFilter('all'); setIsDropdownOpen(false); }}>Tất cả lớp học</div>
                        {taSpaces.map(space => <div key={space.id} className={`dropdown-item ${selectedSpaceFilter === space.id ? 'active' : ''}`} onClick={() => { setSelectedSpaceFilter(space.id); setIsDropdownOpen(false); }}>{space.name}</div>)}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 'auto', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    <FiFilter size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Chọn một lớp cụ thể để xem chi tiết các học viên đang gặp khó khăn trong lớp đó.
                  </div>
                </div>
              </div>

              <div className="ta-card-premium">
                <div className="card-head"><h3>DANH SÁCH HỌC VIÊN CẦN HỖ TRỢ</h3></div>
                <div className="ta-card-body" style={{ padding: '8px 0' }}>
                  {atRiskList.filter(item => !item.is_resolved && (selectedSpaceFilter === 'all' || item.space_id === selectedSpaceFilter)).length > 0 ? (
                    atRiskList.filter(item => !item.is_resolved && (selectedSpaceFilter === 'all' || item.space_id === selectedSpaceFilter)).map(student => (
                      <RiskCard 
                        key={student.id} student={student} spaceName={taSpaces.find(s => s.id === student.space_id)?.name}
                        onResolve={handleResolveAlert} onGetContext={handleOpenCompose}
                        formatOfflineTime={(s) => {
                          const hours = Math.floor(s.hours_since_active || 0);
                          if (hours === 0) return 'Vừa mới';
                          if (hours < 24) return `${hours} giờ`;
                          return `${Math.floor(hours/24)} ngày`;
                        }} 
                        getRiskColor={(score, level) => {
                          if (level === 'critical' || score >= 5) return 'var(--ta-red)';
                          if (level === 'warning' || score >= 2) return 'var(--ta-amber)';
                          return 'var(--ta-green)';
                        }}
                      />
                    ))
                  ) : (
                    <div className="empty-state"><FiCheckSquare size={48} style={{ opacity: 0.2, marginBottom: '16px' }} /><p>Tuyệt vời! Không có học viên nào gặp rủi ro trong bộ lọc này.</p></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="animate-fade">
              <RecapWorkflow 
                currentStep={currentStep} uploading={isAnalyzing} uploadedFile={uploadedFile} isHitlEnabled={aiConfig.isHitlEnabled}
                handleFileUpload={async (e) => {
                  const file = e.target.files[0];
                  if (!file || selectedSpaces.length === 0) return;
                  setUploading(true);
                  try {
                    const res = await taService.uploadSlide(selectedSpaces[0], file);
                    if (res.success) setUploadedFile({ ...res.data, rawFile: file });
                  } catch (error) {} finally { setUploading(false); }
                }} 
                startAiAnalysis={async () => {
                  if (selectedSpaces.length === 0) return;
                  setCurrentStep(2);
                  setIsAnalyzing(true);
                  try {
                    const prompt = buildRecapPrompt();
                    let resAgent;
                    if (uploadedFile && uploadedFile.rawFile) {
                      resAgent = await taService.callAgentWithFile(selectedSpaces[0], prompt, user?.display_name || 'TA', uploadedFile.rawFile);
                    } else {
                      resAgent = await taService.callAgentChat(selectedSpaces[0], prompt, user?.display_name || 'TA');
                    }
                    if (resAgent?.success && resAgent.answer) {
                      const res = await taService.createSummaryDraft({
                        spaceId: selectedSpaces[0], content: resAgent.answer, draft_type: 'lesson_recap',
                        metadata: { file_context: uploadedFile ? uploadedFile.filename : null, generated_at: new Date().toISOString() }
                      });
                      if (res.success) {
                        setAiPreview(res.data);
                        if (aiConfig.isHitlEnabled) setCurrentStep(3);
                        else handleApproveSummary(res.data.id, res.data.space_id);
                      }
                    }
                  } catch (error) { addToast('Lỗi khi phân tích AI', 'error'); setCurrentStep(1); } finally { setIsAnalyzing(false); }
                }}
                aiPreview={aiPreview} scheduleDate={scheduleDate} setScheduleDate={setScheduleDate} handleApproveSummary={handleApproveSummary} setCurrentStep={setCurrentStep}
                setAiPreview={setAiPreview} handleScheduleSummary={handleScheduleSummary} selectedSpaces={selectedSpaces || []} setSelectedSpaces={setSelectedSpaces}
                taSpaces={taSpaces || []} handleRefineAi={handleRefineAi}
              />

              <ScheduledQueueList 
                queue={summaryQueue.filter(q => q.draft_type === 'lesson_recap')}
                taSpaces={taSpaces}
                onEdit={handleEditScheduled}
                onSendNow={handleApproveSummary}
                onCancelSchedule={handleCancelSchedule}
                onBulkCancel={handleBulkCancel}
                onBulkSendNow={handleBulkSendNow}
                isLoading={isSending}
              />
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="animate-fade">
              <AnnouncementWorkflow 
                isHitlEnabled={aiConfig.isHitlEnabled}
                onGenerate={async (p, c) => {
                  if (selectedSpaces.length === 0) return;
                  setIsAnalyzing(true);
                  try {
                    const prompt = buildAnnouncementPrompt(p, c);
                    const resAgent = await taService.callAgentChat(selectedSpaces[0], prompt, user?.display_name || 'TA');
                    if (resAgent?.success && resAgent.answer) {
                      const res = await taService.createSummaryDraft({
                        spaceId: selectedSpaces[0], content: resAgent.answer, draft_type: 'announcement'
                      });
                      if (res.success) {
                        setAiPreview(res.data);
                        if (!aiConfig.isHitlEnabled) handleApproveSummary(res.data.id, res.data.space_id);
                      }
                    }
                  } catch (error) {} finally { setIsAnalyzing(false); }
                }} 
                loading={isAnalyzing} aiPreview={aiPreview} setAiPreview={setAiPreview} handleApprove={handleApproveSummary} handleSchedule={handleScheduleSummary}
                scheduleDate={scheduleDate} setScheduleDate={setScheduleDate} selectedSpaces={selectedSpaces} setSelectedSpaces={setSelectedSpaces}
                taSpaces={taSpaces} handleRefineAi={handleRefineAi}
              />

              <ScheduledQueueList 
                queue={summaryQueue.filter(q => q.draft_type === 'announcement')}
                taSpaces={taSpaces}
                onEdit={handleEditScheduled}
                onSendNow={handleApproveSummary}
                onCancelSchedule={handleCancelSchedule}
                onBulkCancel={handleBulkCancel}
                onBulkSendNow={handleBulkSendNow}
                isLoading={isSending}
              />
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="animate-fade">
              <div className="ta-card-premium">
                <div className="card-head"><h3>Nhật ký hoạt động AI</h3></div>
                <div className="ta-card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {actionLogs.length > 0 ? actionLogs.map((log, index) => (
                    <div key={log.id || index} className="ta-list-row">
                      <div className="flex-shrink-0">
                        {log.ta?.avatar_url ? <img src={log.ta.avatar_url} alt="" className="ta-avatar-sm" /> : <div className="ta-avatar-sm-placeholder"><FiUser /></div>}
                      </div>
                      <div className="flex-1">
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>
                          {log.ta?.display_name || 'Hệ thống'} 
                          <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px' }}>
                            {log.action_type === 'sent_dm' ? 'đã gửi tin nhắn cho' : log.action_type === 'approved_summary' ? 'đã duyệt tóm tắt' : log.action_type === 'dismissed_alert' ? 'đã bỏ qua cảnh báo' : log.action_type === 'sent_announcement' ? 'đã đăng thông báo' : log.action_type}
                          </span>
                          {log.student?.display_name && <span style={{ marginLeft: '8px', color: 'var(--primary)' }}>{log.student.display_name}</span>}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{log.notes}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiClock size={10} /> {new Date(log.created_at).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  )) : <div className="empty-state"><FiActivity size={48} style={{ opacity: 0.2, marginBottom: '16px' }} /><p>Chưa có nhật ký hoạt động nào</p></div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px 0', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
              <div className="ta-card-premium">
                <div className="card-head"><h3>Cấu hình Cơ chế Gửi</h3></div>
                <div className="ta-card-body" style={{ padding: '24px' }}>
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-surface-tertiary rounded-xl border border-primary/10 hover:bg-surface-secondary transition-colors">
                    <input type="checkbox" className="w-5 h-5 accent-primary" checked={configDraft.isHitlEnabled} onChange={(e) => setConfigDraft({...configDraft, isHitlEnabled: e.target.checked})} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>Yêu cầu phê duyệt trước khi gửi (HITL)</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI sẽ tạo bản nháp và chờ bạn kiểm tra lại trước khi đăng vào lớp.</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="ta-card-premium">
                <div className="card-head"><h3>Hướng dẫn trả lời AI (Custom Instruction)</h3></div>
                <div className="ta-card-body" style={{ padding: '24px' }}>
                  <textarea className="ta-input" style={{ minHeight: '160px', resize: 'vertical', lineHeight: '1.6', fontSize: '14px' }} placeholder="Ví dụ: Hãy trả lời ngắn gọn..." value={configDraft.instruction} onChange={(e) => setConfigDraft({...configDraft, instruction: e.target.value})} />
                </div>
              </div>

              <div className="ta-card-premium">
                <div className="card-head"><h3>Cấu hình Recap AI</h3></div>
                <div className="ta-card-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="config-group">
                    <label className="config-label">Xưng hô (Recap)</label>
                    <input type="text" className="ta-input" value={configDraft.recap.pronouns} onChange={(e) => setConfigDraft({...configDraft, recap: {...configDraft.recap, pronouns: e.target.value}})} />
                  </div>
                  <div className="config-group">
                    <label className="config-label">Giọng văn</label>
                    <select className="modern-select" style={{ width: '100%' }} value={configDraft.recap.tone} onChange={(e) => setConfigDraft({...configDraft, recap: {...configDraft.recap, tone: e.target.value}})}>
                      <option value="nhiệt huyết">Nhiệt huyết, năng lượng</option>
                      <option value="chuyên nghiệp">Chuyên nghiệp, ngắn gọn</option>
                      <option value="thân thiện">Thân thiện, gần gũi</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="ta-card-premium">
                <div className="card-head"><h3>Cấu hình Thông báo AI</h3></div>
                <div className="ta-card-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="config-group">
                    <label className="config-label">Xưng hô (Thông báo)</label>
                    <input type="text" className="ta-input" value={configDraft.announcement.pronouns} onChange={(e) => setConfigDraft({...configDraft, announcement: {...configDraft.announcement, pronouns: e.target.value}})} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '40px', gap: '12px' }}>
                <button className="ta-btn" onClick={() => setConfigDraft(aiConfig)}>Huỷ các thay đổi chưa lưu</button>
                <button className="ta-btn" onClick={() => setConfigDraft(DEFAULT_CONFIG)}>Khôi phục mặc định</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TADashboard;
