import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiAlertCircle, FiRefreshCw, FiFileText, FiActivity, FiSettings, 
  FiTrendingUp, FiSend, FiBarChart2, FiCpu, FiClock, FiTrash2, 
  FiLayers, FiFilter, FiEdit3, FiMessageSquare, FiUser, FiCheckCircle, FiCheck, FiX, FiChevronRight, FiCheckSquare, FiZap, FiRotateCcw, FiSave, FiChevronDown, FiGlobe, FiSmile, FiBriefcase, FiList, FiStar
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
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
  const { user } = useSelector((state) => state.auth || {});
  const { spaces = [] } = useSelector((state) => state.space || {});
  
  const taSpaces = Array.isArray(spaces) ? spaces.filter(s => 
    s.role === 'owner' || s.role === 'admin' || s.owner_id === user?.id
  ) : [];

  const [atRiskList, setAtRiskList] = useState([]);
  const [summaryQueue, setSummaryQueue] = useState([]);
  const [actionLogs, setActionLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false); 
  const [isAnalyzing, setIsAnalyzing] = useState(false); 
  const [activeTab, setActiveTab] = useState('at-risk');
  const [selectedSpaceFilter, setSelectedSpaceFilter] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Metrics
  const criticalCountArr = atRiskList.filter(i => i.level === 'critical' || (i.metadata?.score || 0) >= 5);
  const warningCountArr = atRiskList.filter(i => i.level === 'warning' || ((i.metadata?.score || 0) >= 2 && (i.metadata?.score || 0) < 5));
  const resolvedCountArr = actionLogs.filter(l => l.action_type === 'dismissed_alert' || l.action_type === 'sent_dm');
  const timeSavedVal = actionLogs.reduce((acc, log) => {
    switch (log.action_type) {
      case 'lesson_recap': return acc + 30;
      case 'announcement': return acc + 15;
      case 'sent_dm': return acc + 10;
      case 'dismissed_alert': return acc + 5;
      default: return acc + 5;
    }
  }, 0); 

  const finalChartData = [
    { name: 'Nguy hiểm', value: criticalCountArr.length, color: 'var(--ta-red)' },
    { name: 'Cảnh báo', value: warningCountArr.length, color: 'var(--ta-amber)' },
    { name: 'Đã xử lý', value: resolvedCountArr.length, color: 'var(--ta-green)' },
  ];

  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const [currentStep, setCurrentStep] = useState(1); 
  const [aiPreview, setAiPreview] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(''); 
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedSpaces, setSelectedSpaces] = useState([]);

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState(null);

  // --- HYBRID AI CONFIG ---
  const DEFAULT_CONFIG = {
    global: { pronouns: "mình - các bạn", instruction: "", language: "Tiếng Việt", rules: { useEmoji: true, friendlyTone: true, noRobotic: true } },
    dm: { tone: "helpful", length: "vừa phải", goal: "hỏi thăm", instruction: "", rules: { offerSupport1on1: true, mentionLastSeen: true } },
    recap: { tone: "nhiệt huyết", structure: "bullet points", highlight: "nội dung chính", instruction: "", pronouns: "", rules: { includeHomework: true, includeTips: false, useTable: false } },
    announcement: { tone: "chuyên nghiệp", urgency: "bình thường", instruction: "", pronouns: "", rules: { boldKeyInfo: true, urgentAction: false } },
    isHitlEnabled: true
  };

  const [aiConfig, setAiConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('ta_ai_config_v13'); 
      if (!saved) return DEFAULT_CONFIG;
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        global: { ...DEFAULT_CONFIG.global, ...parsed.global, rules: { ...DEFAULT_CONFIG.global.rules, ...(parsed.global?.rules || {}) } },
        dm: { ...DEFAULT_CONFIG.dm, ...parsed.dm, rules: { ...DEFAULT_CONFIG.dm.rules, ...(parsed.dm?.rules || {}) } },
        recap: { ...DEFAULT_CONFIG.recap, ...parsed.recap, rules: { ...DEFAULT_CONFIG.recap.rules, ...(parsed.recap?.rules || {}) } },
        announcement: { ...DEFAULT_CONFIG.announcement, ...parsed.announcement, rules: { ...DEFAULT_CONFIG.announcement.rules, ...(parsed.announcement?.rules || {}) } }
      };
    } catch (e) { return DEFAULT_CONFIG; }
  });

  const [configDraft, setConfigDraft] = useState(aiConfig);

  useEffect(() => {
    setConfigDraft(aiConfig);
  }, [aiConfig]);

  const handleSaveConfig = () => {
    setAiConfig(configDraft);
    localStorage.setItem('ta_ai_config_v13', JSON.stringify(configDraft));
    addToast('Đã lưu luật chơi AI mới!');
  };

  const compileRules = (rulesObj = {}) => {
    const ruleTexts = {
      useEmoji: "Sử dụng emoji phù hợp",
      friendlyTone: "Giọng văn thân thiện",
      noRobotic: "Tránh dùng từ ngữ máy móc",
      offerSupport1on1: "Đề nghị hỗ trợ 1-1",
      mentionLastSeen: "Đề cập đến thời gian vắng mặt",
      includeHomework: "Có mục bài tập về nhà",
      includeTips: "Có mục Tips & Tricks",
      useTable: "Sử dụng bảng tóm tắt",
      boldKeyInfo: "In đậm thông tin quan trọng",
      urgentAction: "Yêu cầu hành động khẩn cấp"
    };
    return Object.entries(rulesObj)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => `- ${ruleTexts[key] || key}`)
      .join('\n');
  };

  const buildRecapPrompt = () => {
    const g = aiConfig.global;
    const r = aiConfig.recap;
    return `[GLOBAL] Xưng hô: ${r.pronouns || g.pronouns}. Quy tắc:\n${compileRules(g.rules)}\n${g.instruction}\n[RECAP] Tone: ${r.tone}. Focus: ${r.highlight}. Quy tắc:\n${compileRules(r.rules)}\n${r.instruction}`;
  };

  const buildAnnouncementPrompt = (p, c) => {
    const g = aiConfig.global;
    const a = aiConfig.announcement;
    return `[GLOBAL] Xưng hô: ${a.pronouns || g.pronouns}. Quy tắc:\n${compileRules(g.rules)}\n[THÔNG BÁO] Loại: ${p}. Ngữ cảnh: ${c}. Quy tắc:\n${compileRules(a.rules)}\n${a.instruction}`;
  };

  const fetchData = async () => {
    try {
      const allAtRisk = [];
      const allQueue = [];
      const allLogs = [];
      const targetSpaces = taSpaces.length > 0 ? taSpaces : spaces;

      await Promise.all(targetSpaces.map(async (space) => {
        if (!space.id) return;
        try { 
          const [atRiskRes, queueRes, logsRes] = await Promise.allSettled([
            taService.getAtRiskList(space.id),
            taService.getSummaryQueue(space.id),
            taService.getActionLogs(space.id)
          ]);
          if (atRiskRes.status === 'fulfilled' && atRiskRes.value.success) allAtRisk.push(...(atRiskRes.value.data || []).map(s => ({ ...s, space_id: space.id })));
          if (queueRes.status === 'fulfilled' && queueRes.value.success) allQueue.push(...(queueRes.value.data || []).map(q => ({ ...q, space_id: space.id })));
          if (logsRes.status === 'fulfilled' && logsRes.value.success) allLogs.push(...(logsRes.value.data || []));
        } catch (e) {}
      }));
      setAtRiskList(allAtRisk);
      setSummaryQueue(allQueue);
      setActionLogs(allLogs);
    } catch (error) {}
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      const targetSpaces = taSpaces.length > 0 ? taSpaces : spaces;
      await Promise.all(targetSpaces.map(async (space) => {
        if (space.id) await taService.scanAtRisk(space.id);
      }));
      await fetchData();
      addToast('Làm mới thành công!');
    } catch (error) { addToast('Lỗi refresh', 'error'); } finally { setIsRefreshing(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [spaces.length, taSpaces.length]);

  const handleResolveAlert = async (id, spaceId) => {
    try {
      const res = await taService.resolveAlert(id, spaceId);
      if (res.success) {
        setAtRiskList(prev => prev.filter(item => item.id !== id));
        addToast('Đã giải quyết');
        fetchData();
      }
    } catch (error) {}
  };

  const handleApproveSummary = async (draftId, spaceId) => {
    setIsSending(true);
    try {
      if (aiPreview?.id === draftId) await taService.updateSummaryDraft(draftId, spaceId, { content: aiPreview.content });
      const res = await taService.approveSummary(draftId, spaceId);
      if (res.success && selectedSpaces.length > 1 && (!aiPreview || aiPreview.status === 'pending')) {
        const otherSpaces = selectedSpaces.filter(id => id !== spaceId);
        await Promise.all(otherSpaces.map(async (sid) => {
          const newDraftRes = await taService.createSummaryDraft({ spaceId: sid, content: aiPreview?.content || '', draft_type: aiPreview?.draft_type });
          if (newDraftRes?.success) await taService.approveSummary(newDraftRes.data.id, sid);
        }));
      }
      addToast('Đã đăng bài!'); fetchData(); setAiPreview(null); setCurrentStep(1);
    } catch (error) { addToast('Lỗi gửi bài', 'error'); } finally { setIsSending(false); }
  };

  const handleScheduleSummary = async (draftId, spaceId, scheduledAt) => {
    setIsSending(true);
    try {
      if (aiPreview?.id === draftId) await taService.updateSummaryDraft(draftId, spaceId, { content: aiPreview.content });
      const isoDate = new Date(scheduledAt).toISOString();
      const res = await taService.scheduleSummary(draftId, spaceId, isoDate);
      
      if (res.success && selectedSpaces.length > 1 && (!aiPreview || aiPreview.status === 'pending')) {
        const otherSpaces = selectedSpaces.filter(id => id !== spaceId);
        await Promise.all(otherSpaces.map(async (sid) => {
          const newDraftRes = await taService.createSummaryDraft({ spaceId: sid, content: aiPreview?.content || '', draft_type: aiPreview?.draft_type });
          if (newDraftRes?.success) await taService.scheduleSummary(newDraftRes.data.id, sid, isoDate);
        }));
      }
      
      addToast('Đã đặt lịch!'); fetchData(); setAiPreview(null); setCurrentStep(1);
    } catch (error) {} finally { setIsSending(false); }
  };

  const handleEditScheduled = (item) => {
    setAiPreview(item);
    setSelectedSpaces([item.space_id]);
    if (item.draft_type === 'lesson_recap') { setActiveTab('summary'); setCurrentStep(3); }
    else { setActiveTab('announcements'); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBulkCancel = async (ids) => {
    setIsSending(true);
    try {
      await Promise.all(ids.map(async id => {
        const item = summaryQueue.find(q => q.id === id);
        if(item) await taService.cancelSchedule(id, item.space_id);
      }));
      addToast('Đã hủy lịch hàng loạt');
      fetchData();
    } catch (e) {} finally { setIsSending(false); }
  };

  const handleBulkSendNow = async (ids) => {
    setIsSending(true);
    try {
      await Promise.all(ids.map(async id => {
        const item = summaryQueue.find(q => q.id === id);
        if(item) await taService.approveSummary(id, item.space_id);
      }));
      addToast('Đã gửi hàng loạt');
      fetchData();
    } catch (e) {} finally { setIsSending(false); }
  };

  const handleCancelSchedule = async (draftId, spaceId) => {
    try {
      setIsSending(true);
      const res = await taService.cancelSchedule(draftId, spaceId);
      if (res.success) { addToast('Đã hủy lịch'); fetchData(); }
    } catch (error) {} finally { setIsSending(false); }
  };

  const handleRefineAi = async (refineInstruction) => {
    if (!aiPreview || !selectedSpaces.length) return;
    setIsAnalyzing(true);
    try {
      const prompt = `Đây là nội dung bản thảo hiện tại:\n${aiPreview.content}\nHãy sửa lại theo yêu cầu: ${refineInstruction}`;
      const resAgent = await taService.callAgentChat(selectedSpaces[0], prompt, user?.id);
      
      const aiContent = resAgent?.answer || resAgent?.content || resAgent?.response;
      if (resAgent?.success && aiContent) {
        const res = await taService.updateSummaryDraft(aiPreview.id, selectedSpaces[0], { content: aiContent });
        if (res?.success) {
          setAiPreview(res.data);
          addToast('Đã cập nhật bản thảo!');
        }
      } else { addToast('AI không phản hồi lệnh sửa', 'error'); }
    } catch (error) { addToast('Lỗi hiệu chỉnh AI', 'error'); } finally { setIsAnalyzing(false); }
  };

  const handleOpenCompose = async (snapshotId, spaceId) => {
    try {
      setLoading(true);
      const res = await taService.getAtRiskContext(snapshotId, spaceId);
      if (res.success) {
        setCurrentContext({ id: snapshotId, space_id: spaceId, ...res.data, aiConfig, taName: user?.display_name });
        setIsComposeOpen(true);
      }
    } catch (error) {} finally { setLoading(false); }
  };

  const handleAiSend = async (message) => {
    if (!currentContext) return;
    try {
      setLoading(true);
      const res = await taService.sendSmartMessage(currentContext.space_id, {
        taId: user?.id, studentId: currentContext.student_info?.id,
        content: message, snapshotId: currentContext.id
      });
      if (res.success) { setIsComposeOpen(false); handleResolveAlert(currentContext.id, currentContext.space_id); addToast('Đã gửi tin nhắn!'); }
    } catch (error) {} finally { setLoading(false); }
  };

  const RuleCheckbox = ({ label, checked, onChange }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 12px', background: 'var(--bg-surface-tertiary)', borderRadius: '8px', border: checked ? '1px solid var(--primary)' : '1px solid var(--border-primary)', transition: '0.2s' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ width: '14px', height: '14px' }} />
      <span style={{ fontSize: '12px', fontWeight: 600, color: checked ? 'var(--primary)' : 'var(--text-secondary)' }}>{label}</span>
    </label>
  );

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
            <button className="ta-btn" onClick={handleRefreshAll} disabled={isRefreshing}>
              <FiRefreshCw className={isRefreshing ? 'spin' : ''} />
            </button>
          </div>
        </header>

        <div className="ta-scroll-content" key={activeTab}>
          {activeTab === 'at-risk' && (
            <div className="animate-fade">
              <div className="metrics-grid">
                <div className="stat-card critical"><span className="stat-label">Rủi ro Nghiêm trọng</span><div className="stat-value">{criticalCountArr.length} <span>học viên</span></div></div>
                <div className="stat-card warning"><span className="stat-label">Cần chú ý</span><div className="stat-value">{warningCountArr.length} <span>học viên</span></div></div>
                <div className="stat-card success"><span className="stat-label">Tiết kiệm thời gian</span><div className="stat-value">{timeSavedVal} <span>phút/tuần</span></div></div>
              </div>

              <div className="monitoring-overview">
                <div className="chart-card">
                  <h4>TỔNG QUAN XỬ LÝ</h4>
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                      <BarChart data={finalChartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-primary)" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '11px', fontWeight: 600 }} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-primary)', borderRadius: '8px' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                          {finalChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
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
                        <span>{selectedSpaceFilter === 'all' ? 'Tất cả lớp học' : (taSpaces.find(s => s.id === selectedSpaceFilter)?.name || spaces.find(s => s.id === selectedSpaceFilter)?.name)}</span>
                      </div>
                      <FiChevronDown />
                    </div>
                    {isDropdownOpen && (
                      <div className="dropdown-menu">
                        <div className={`dropdown-item ${selectedSpaceFilter === 'all' ? 'active' : ''}`} onClick={() => { setSelectedSpaceFilter('all'); setIsDropdownOpen(false); }}>Tất cả lớp học</div>
                        {(taSpaces.length > 0 ? taSpaces : spaces).map(space => (
                          <div key={space.id} className={`dropdown-item ${selectedSpaceFilter === space.id ? 'active' : ''}`} onClick={() => { setSelectedSpaceFilter(space.id); setIsDropdownOpen(false); }}>{space.name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="ta-card-premium">
                <div className="card-head"><h3>DANH SÁCH CẦN HỖ TRỢ</h3></div>
                <div className="ta-card-body" style={{ padding: '8px 0' }}>
                  {atRiskList.filter(item => selectedSpaceFilter === 'all' || item.space_id === selectedSpaceFilter).length > 0 ? (
                    atRiskList.filter(item => selectedSpaceFilter === 'all' || item.space_id === selectedSpaceFilter).map(student => (
                      <RiskCard 
                        key={student.id} student={student} spaceName={taSpaces.find(s => s.id === student.space_id)?.name || spaces.find(s => s.id === student.space_id)?.name}
                        onResolve={handleResolveAlert} onGetContext={handleOpenCompose}
                        formatOfflineTime={(s) => {
                          const hours = Math.floor(s.hours_since_active || 0);
                          return hours === 0 ? 'Vừa mới' : (hours < 24 ? `${hours} giờ` : `${Math.floor(hours/24)} ngày`);
                        }} 
                        getRiskColor={(score, level) => level === 'critical' ? 'var(--ta-red)' : 'var(--ta-amber)'}
                      />
                    ))
                  ) : (
                    <div className="empty-state"><FiCheckSquare size={48} style={{ opacity: 0.2, marginBottom: '16px' }} /><p>Tuyệt vời! Không có học viên nào gặp rủi ro.</p></div>
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
                  setCurrentStep(2); setIsAnalyzing(true);
                  try {
                    const prompt = buildRecapPrompt();
                    let resAgent;
                    if (uploadedFile && uploadedFile.rawFile) resAgent = await taService.callAgentWithFile(selectedSpaces[0], prompt, user?.id || 'TA', uploadedFile.rawFile);
                    else resAgent = await taService.callAgentChat(selectedSpaces[0], prompt, user?.id || 'TA');
                    
                    const aiContent = resAgent?.answer || resAgent?.content || resAgent?.response;
                    if (resAgent?.success && aiContent) {
                      const res = await taService.createSummaryDraft({ spaceId: selectedSpaces[0], content: aiContent, draft_type: 'lesson_recap' });
                      if (res?.success) {
                        const draftData = res.data;
                        setAiPreview(draftData); 
                        if (aiConfig.isHitlEnabled) setCurrentStep(3); 
                        else handleApproveSummary(draftData.id, draftData.space_id); 
                      }
                    } else { addToast('AI không phản hồi', 'error'); }
                  } catch (error) { addToast('Lỗi khi phân tích AI', 'error'); setCurrentStep(1); } finally { setIsAnalyzing(false); }
                }}
                aiPreview={aiPreview} scheduleDate={scheduleDate} setScheduleDate={setScheduleDate} handleApproveSummary={handleApproveSummary} setCurrentStep={setCurrentStep}
                setAiPreview={setAiPreview} handleScheduleSummary={handleScheduleSummary} selectedSpaces={selectedSpaces || []} setSelectedSpaces={setSelectedSpaces}
                taSpaces={taSpaces || []} handleRefineAi={handleRefineAi}
              />
              <ScheduledQueueList queue={summaryQueue.filter(q => q.draft_type === 'lesson_recap')} taSpaces={spaces} onEdit={handleEditScheduled} onSendNow={handleApproveSummary} onCancelSchedule={handleCancelSchedule} onBulkCancel={handleBulkCancel} onBulkSendNow={handleBulkSendNow} isLoading={isSending} />
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
                    const resAgent = await taService.callAgentChat(selectedSpaces[0], prompt, user?.id || 'TA');
                    
                    const aiContent = resAgent?.answer || resAgent?.content || resAgent?.response;
                    if (resAgent?.success && aiContent) {
                      const res = await taService.createSummaryDraft({ spaceId: selectedSpaces[0], content: aiContent, draft_type: 'announcement' });
                      if (res?.success) { 
                        const draftData = res.data;
                        setAiPreview(draftData); 
                        if (!aiConfig.isHitlEnabled) handleApproveSummary(draftData.id, draftData.space_id); 
                      }
                    } else { addToast('AI không phản hồi', 'error'); }
                  } catch (error) { addToast('Lỗi khi soạn thông báo', 'error'); } finally { setIsAnalyzing(false); }
                }} 
                loading={isAnalyzing} aiPreview={aiPreview} setAiPreview={setAiPreview} handleApprove={handleApproveSummary} handleSchedule={handleScheduleSummary}
                scheduleDate={scheduleDate} setScheduleDate={setScheduleDate} selectedSpaces={selectedSpaces} setSelectedSpaces={setSelectedSpaces}
                taSpaces={taSpaces} handleRefineAi={handleRefineAi}
              />
              <ScheduledQueueList queue={summaryQueue.filter(q => q.draft_type === 'announcement')} taSpaces={spaces} onEdit={handleEditScheduled} onSendNow={handleApproveSummary} onCancelSchedule={handleCancelSchedule} onBulkCancel={handleBulkCancel} onBulkSendNow={handleBulkSendNow} isLoading={isSending} />
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
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{log.ta?.display_name || 'Hệ thống'} <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px' }}>{log.action_type}</span></div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{log.notes}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}><FiClock size={10} /> {new Date(log.created_at).toLocaleString('vi-VN')}</div>
                      </div>
                    </div>
                  )) : <div className="empty-state"><FiActivity size={48} style={{ opacity: 0.2, marginBottom: '16px' }} /><p>Chưa có nhật ký hoạt động nào</p></div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '24px 0', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
              
              {/* 1. LUẬT CHUNG */}
              <div className="ta-card-premium">
                <div className="card-head" style={{ borderLeft: '4px solid var(--primary)' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FiGlobe /> Cấu hình Toàn cục</h3>
                </div>
                <div className="ta-card-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="config-group"><label className="config-label">Xưng hô mặc định</label><input type="text" className="ta-input" value={configDraft.global.pronouns} onChange={(e) => setConfigDraft({...configDraft, global: {...configDraft.global, pronouns: e.target.value}})} /></div>
                  <div className="config-group">
                    <label className="config-label">Luật chung (Ô trống)</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <RuleCheckbox label="✨ Dùng Emoji" checked={configDraft.global.rules?.useEmoji} onChange={(e) => setConfigDraft({...configDraft, global: {...configDraft.global, rules: {...configDraft.global.rules, useEmoji: e.target.checked}}})} />
                      <RuleCheckbox label="😊 Thân thiện" checked={configDraft.global.rules?.friendlyTone} onChange={(e) => setConfigDraft({...configDraft, global: {...configDraft.global, rules: {...configDraft.global.rules, friendlyTone: e.target.checked}}})} />
                      <RuleCheckbox label="🚫 Cấm dùng từ máy móc" checked={configDraft.global.rules?.noRobotic} onChange={(e) => setConfigDraft({...configDraft, global: {...configDraft.global, rules: {...configDraft.global.rules, noRobotic: e.target.checked}}})} />
                    </div>
                    <textarea className="ta-input" style={{ minHeight: '80px' }} placeholder="Bổ trợ thêm bằng Prompt cụ thể..." value={configDraft.global.instruction} onChange={(e) => setConfigDraft({...configDraft, global: {...configDraft.global, instruction: e.target.value}})} />
                  </div>
                </div>
              </div>

              {/* 2. LUẬT DM */}
              <div className="ta-card-premium">
                <div className="card-head" style={{ borderLeft: '4px solid var(--ta-blue)' }}>
                  <h3><FiMessageSquare /> Soạn tin DM</h3>
                </div>
                <div className="ta-card-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="config-group">
                    <label className="config-label">Luật DM (Ô trống)</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <RuleCheckbox label="🤝 Hỗ trợ 1-1" checked={configDraft.dm.rules?.offerSupport1on1} onChange={(e) => setConfigDraft({...configDraft, dm: {...configDraft.dm, rules: {...configDraft.dm.rules, offerSupport1on1: e.target.checked}}})} />
                      <RuleCheckbox label="📅 Nhắc ngày vắng" checked={configDraft.dm.rules?.mentionLastSeen} onChange={(e) => setConfigDraft({...configDraft, dm: {...configDraft.dm, rules: {...configDraft.dm.rules, mentionLastSeen: e.target.checked}}})} />
                    </div>
                    <textarea className="ta-input" style={{ minHeight: '80px' }} placeholder="Nhập prompt cụ thể cho DM..." value={configDraft.dm.instruction} onChange={(e) => setConfigDraft({...configDraft, dm: {...configDraft.dm, instruction: e.target.value}})} />
                  </div>
                </div>
              </div>

              {/* 3. LUẬT RECAP */}
              <div className="ta-card-premium">
                <div className="card-head" style={{ borderLeft: '4px solid var(--ta-amber)' }}>
                  <h3><FiFileText /> Recap AI</h3>
                </div>
                <div className="ta-card-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="config-group">
                    <label className="config-label">Xưng hô riêng</label>
                    <input type="text" className="ta-input" placeholder="Để trống để dùng chung" value={configDraft.recap.pronouns} onChange={(e) => setConfigDraft({...configDraft, recap: {...configDraft.recap, pronouns: e.target.value}})} />
                  </div>
                  <div className="config-group">
                    <label className="config-label">Luật Recap (Ô trống)</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <RuleCheckbox label="📝 Có Bài tập" checked={configDraft.recap.rules?.includeHomework} onChange={(e) => setConfigDraft({...configDraft, recap: {...configDraft.recap, rules: {...configDraft.recap.rules, includeHomework: e.target.checked}}})} />
                      <RuleCheckbox label="💡 Có Tips/Tricks" checked={configDraft.recap.rules?.includeTips} onChange={(e) => setConfigDraft({...configDraft, recap: {...configDraft.recap, rules: {...configDraft.recap.rules, includeTips: e.target.checked}}})} />
                      <RuleCheckbox label="📊 Dạng bảng" checked={configDraft.recap.rules?.useTable} onChange={(e) => setConfigDraft({...configDraft, recap: {...configDraft.recap, rules: {...configDraft.recap.rules, useTable: e.target.checked}}})} />
                    </div>
                    <textarea className="ta-input" style={{ minHeight: '80px' }} placeholder="Nhập prompt bổ trợ Recap..." value={configDraft.recap.instruction} onChange={(e) => setConfigDraft({...configDraft, recap: {...configDraft.recap, instruction: e.target.value}})} />
                  </div>
                </div>
              </div>

              {/* 4. LUẬT THÔNG BÁO */}
              <div className="ta-card-premium">
                <div className="card-head" style={{ borderLeft: '4px solid var(--ta-red)' }}>
                  <h3><FiMessageSquare /> Thông báo AI</h3>
                </div>
                <div className="ta-card-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="config-group">
                    <label className="config-label">Xưng hô riêng</label>
                    <input type="text" className="ta-input" placeholder="Để trống để dùng chung" value={configDraft.announcement.pronouns} onChange={(e) => setConfigDraft({...configDraft, announcement: {...configDraft.announcement, pronouns: e.target.value}})} />
                  </div>
                  <div className="config-group">
                    <label className="config-label">Luật Thông báo (Ô trống)</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <RuleCheckbox label="<b> In đậm mấu chốt" checked={configDraft.announcement.rules?.boldKeyInfo} onChange={(e) => setConfigDraft({...configDraft, announcement: {...configDraft.announcement, rules: {...configDraft.announcement.rules, boldKeyInfo: e.target.checked}}})} />
                      <RuleCheckbox label="🚨 Yêu cầu khẩn cấp" checked={configDraft.announcement.rules?.urgentAction} onChange={(e) => setConfigDraft({...configDraft, announcement: {...configDraft.announcement, rules: {...configDraft.announcement.rules, urgentAction: e.target.checked}}})} />
                    </div>
                    <textarea className="ta-input" style={{ minHeight: '80px' }} placeholder="Nhập prompt bổ trợ thông báo..." value={configDraft.announcement.instruction} onChange={(e) => setConfigDraft({...configDraft, announcement: {...configDraft.announcement, instruction: e.target.value}})} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '60px', gap: '12px' }}>
                <button className="ta-btn" onClick={() => setConfigDraft(aiConfig)}>Hủy thay đổi</button>
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
