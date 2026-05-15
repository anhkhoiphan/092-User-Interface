import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  FiAlertCircle, FiRefreshCw, FiFileText, FiActivity, FiSettings,
  FiTrendingUp, FiSend, FiBarChart2, FiCpu, FiClock, FiTrash2,
  FiLayers, FiFilter, FiEdit3, FiMessageSquare, FiUser, FiCheckCircle, FiCheck, FiX, FiChevronRight, FiCheckSquare, FiZap, FiRotateCcw, FiSave, FiChevronDown, FiGlobe, FiSmile, FiBriefcase, FiList, FiStar, FiArchive, FiEye, FiArrowLeft
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
import QuizWorkflow from '../components/ta/QuizWorkflow';
import QuizPlayer from '../components/ta/QuizPlayer';
import QuizResults from '../components/ta/QuizResults';

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

  // Filter at-risk list by selected space
  const filteredAtRiskList = selectedSpaceFilter === 'all'
    ? atRiskList
    : atRiskList.filter(item => item.space_id === selectedSpaceFilter);

  // Metrics (use filtered list for charts)
  const criticalCountArr = filteredAtRiskList.filter(i => i.level === 'critical' || (i.metadata?.score || 0) >= 5);
  const warningCountArr = filteredAtRiskList.filter(i => i.level === 'warning' || ((i.metadata?.score || 0) >= 2 && (i.metadata?.score || 0) < 5));
  const filteredActionLogs = selectedSpaceFilter === 'all'
    ? actionLogs
    : actionLogs.filter(log => log.space_id === selectedSpaceFilter);
  const resolvedCountArr = filteredActionLogs.filter(l => l.action_type === 'dismissed_alert' || l.action_type === 'sent_dm');
  const timeSavedVal = filteredActionLogs.reduce((acc, log) => {
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

  // Quiz state
  const [quizMode, setQuizMode] = useState(null); // null, 'edit', 'play', 'results'
  const [currentQuizId, setCurrentQuizId] = useState(null);
  const [quizList, setQuizList] = useState([]);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [studentQuizOpen, setStudentQuizOpen] = useState(false);
  const [studentQuizId, setStudentQuizId] = useState(null);
  const [sendingQuizId, setSendingQuizId] = useState(null);

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
    const pronouns = r.pronouns || g.pronouns;
    return `[ROLE] Bạn là một Trợ Giảng (Teaching Assistant) xuất sắc.
[OBJECTIVE] Phân tích nội dung buổi học và trả về dữ liệu có cấu trúc gồm: tóm tắt bài giảng + danh sách deadline.
[RULES]
- Xưng hô bắt buộc: ${pronouns}.
- Tone giọng: ${r.tone}.
- Trọng tâm (Focus): ${r.highlight}.
- Quy tắc chung:\\n${compileRules(g.rules)}\\n${g.instruction}
- Quy tắc Recap:\\n${compileRules(r.rules)}\\n${r.instruction}
[OUTPUT FORMAT] Bắt buộc trả về valid JSON với cấu trúc sau:
{
  "summary": "Nội dung tóm tắt bài giảng định dạng Markdown",
  "deadlines": [
    { "title": "Tên bài tập", "due_date": "YYYY-MM-DD hoặc mô tả ngày", "description": "Mô tả ngắn về yêu cầu" }
  ]
}
TUYỆT ĐỐI KHÔNG thêm bất kỳ nội dung nào khác ngoài JSON (không có markdown code blocks, không có lời giải thích).`;
  };

  // Parse AI JSON response with fallback to text extraction
  const parseAiRecapResponse = (aiContent) => {
    if (!aiContent) return { summary: '', deadlines: [] };

    // Extract deadlines from text using regex (for fallback)
    const extractDeadlinesFromText = (content) => {
      const patterns = [
        /[-•*]\s*.*?(?:bài tập|homework|assignment|deadline|hạn|nộp|due date|làm|chuẩn bị).*?(?:\n|$)/gi,
        /[-•*]\s*(?:đóng|gửi|submit).*?(?:bài|file|nội dung).*?(?:\n|$)/gi,
        /\d{1,2}[\/-]\d{1,2}(?:\/\d{2,4})?\s*[.:]\s*.+?[\n]/gi
      ];
      const deadlines = new Set();
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const cleanMatch = match.trim()
              .replace(/^[-•*]\s*/, '')
              .replace(/\s+/g, ' ')
              .slice(0, 150);
            if (cleanMatch.length > 8 && cleanMatch.length < 151) {
              deadlines.add(cleanMatch);
            }
          });
        }
      }
      return Array.from(deadlines).slice(0, 5);
    };

    try {
      // Extract JSON from code blocks first (handle ```json ... ```)
      let jsonStr = aiContent.trim();
      const codeBlockMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        jsonStr = codeBlockMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);

      // Validate structure
      if (parsed.summary && Array.isArray(parsed.deadlines)) {
        return {
          summary: parsed.summary,
          deadlines: parsed.deadlines
            .filter(d => d?.title && d?.due_date)
            .map(d => ({
              title: d.title,
              due_date: d.due_date,
              description: d.description || ''
            }))
        };
      }
    } catch (e) {
      // JSON parse failed, fall back to text extraction
      console.warn('Failed to parse AI JSON response, using fallback extraction');
    }

    // Fallback: return raw content with extracted deadlines from text
    return {
      summary: aiContent,
      deadlines: extractDeadlinesFromText(aiContent).map(text => ({
        title: text,
        due_date: '',
        description: ''
      }))
    };
  };

  const buildAnnouncementPrompt = (p, c) => {
    const g = aiConfig.global;
    const a = aiConfig.announcement;
    const pronouns = a.pronouns || g.pronouns;
    return `[ROLE] Bạn là một Trợ Giảng (Teaching Assistant) xuất sắc.
[OBJECTIVE] Viết một bài Thông Báo (Announcement) gửi cho lớp học.
[CONTEXT] 
- Loại thông báo: ${p}
- Ngữ cảnh chi tiết: ${c}
[RULES]
- Xưng hô bắt buộc: ${pronouns}.
- Quy tắc chung:\\n${compileRules(g.rules)}\\n${g.instruction}
- Quy tắc Thông báo:\\n${compileRules(a.rules)}\\n${a.instruction}
[OUTPUT FORMAT] CHỈ xuất ra nội dung bài viết định dạng Markdown. TUYỆT ĐỐI KHÔNG kèm theo các câu giao tiếp của AI (như 'Đây là bài viết...', 'Vâng, tôi hiểu').`;
  };

  const fetchData = async () => {
    try {
      const allAtRisk = [];
      const allQueue = [];
      const allLogs = [];
      const allQuizzes = [];
      const targetSpaces = taSpaces.length > 0 ? taSpaces : spaces;

      await Promise.all(targetSpaces.map(async (space) => {
        if (!space.id) return;
        try { 
          const [atRiskRes, queueRes, logsRes, quizzesRes] = await Promise.allSettled([
            taService.getAtRiskList(space.id),
            taService.getSummaryQueue(space.id),
            taService.getActionLogs(space.id),
            taService.listQuizzes(space.id)
          ]);
          if (atRiskRes.status === 'fulfilled' && atRiskRes.value.success) allAtRisk.push(...(atRiskRes.value.data || []).map(s => ({ ...s, space_id: space.id })));
          if (queueRes.status === 'fulfilled' && queueRes.value.success) allQueue.push(...(queueRes.value.data || []).map(q => ({ ...q, space_id: space.id })));
          if (logsRes.status === 'fulfilled' && logsRes.value.success) allLogs.push(...(logsRes.value.data || []));
          if (quizzesRes.status === 'fulfilled' && quizzesRes.value.success) {
            allQuizzes.push(...(quizzesRes.value.data || []).map(q => ({ ...q, space_id: space.id, space_name: space.name })));
          }
        } catch (e) {}
      }));
      setAtRiskList(allAtRisk);
      setSummaryQueue(allQueue);
      setActionLogs(allLogs);
      setQuizList(allQuizzes);
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
    } catch (error) {
      console.error('handleResolveAlert error:', error);
      addToast('Lỗi giải quyết cảnh báo', 'error');
    }
  };

  const handleApproveSummary = async (draftId, spaceId, autoPilotData = null) => {
    setIsSending(true);
    try {
      const activeContent = autoPilotData?.content || aiPreview?.content || '';
      const activeType = autoPilotData?.draft_type || aiPreview?.draft_type || '';
      const activeDeadlines = autoPilotData?.metadata?.deadlines || aiPreview?.deadlines || [];

      if (aiPreview?.id === draftId) await taService.updateSummaryDraft(draftId, spaceId, { content: activeContent });
      const res = await taService.approveSummary(draftId, spaceId);
      if (!res.success) {
        console.error('Approve summary failed:', res);
        throw new Error('API returned failure');
      }
      if (selectedSpaces.length > 1 && (!aiPreview || aiPreview.status === 'pending')) {
        const otherSpaces = selectedSpaces.filter(id => id !== spaceId);
        await Promise.all(otherSpaces.map(async (sid) => {
          const newDraftRes = await taService.createSummaryDraft({ spaceId: sid, content: activeContent, draft_type: activeType, metadata: { deadlines: activeDeadlines } });
          if (newDraftRes?.success && newDraftRes?.data) await taService.approveSummary(newDraftRes.data.id, sid);
        }));
      }
      addToast('Đã đăng bài!'); fetchData(); setAiPreview(null); setCurrentStep(1);
    } catch (error) {
      console.error('handleApproveSummary error:', error);
      addToast(error.message || 'Lỗi gửi bài', 'error');
    } finally { setIsSending(false); }
  };

  const handleScheduleSummary = async (draftId, spaceId, scheduledAt, autoPilotData = null) => {
    setIsSending(true);
    try {
      const activeContent = autoPilotData?.content || aiPreview?.content || '';
      const activeType = autoPilotData?.draft_type || aiPreview?.draft_type || '';
      const activeDeadlines = autoPilotData?.metadata?.deadlines || aiPreview?.deadlines || [];

      if (aiPreview?.id === draftId) await taService.updateSummaryDraft(draftId, spaceId, { content: activeContent });
      const isoDate = new Date(scheduledAt).toISOString();
      const res = await taService.scheduleSummary(draftId, spaceId, isoDate);
      
      if (res.success && selectedSpaces.length > 1 && (!aiPreview || aiPreview.status === 'pending')) {
        const otherSpaces = selectedSpaces.filter(id => id !== spaceId);
        await Promise.all(otherSpaces.map(async (sid) => {
          const newDraftRes = await taService.createSummaryDraft({ spaceId: sid, content: activeContent, draft_type: activeType, metadata: { deadlines: activeDeadlines } });
          if (newDraftRes?.success && newDraftRes?.data) await taService.scheduleSummary(newDraftRes.data.id, sid, isoDate);
        }));
      }
      
      addToast('Đã đặt lịch!'); fetchData(); setAiPreview(null); setCurrentStep(1);
    } catch (error) {
      console.error('handleScheduleSummary error:', error);
      addToast(error.message || 'Lỗi đặt lịch', 'error');
    } finally { setIsSending(false); }
  };

  const handleEditScheduled = (item) => {
    // Normalize: add top-level deadlines from metadata for consistent extraction
    const normalizedItem = {
      ...item,
      deadlines: item.metadata?.deadlines || []
    };
    setAiPreview(normalizedItem);
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
    } catch (e) {
      console.error('handleBulkCancel error:', e);
      addToast('Lỗi hủy lịch hàng loạt', 'error');
    } finally { setIsSending(false); }
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
    } catch (e) {
      console.error('handleBulkSendNow error:', e);
      addToast('Lỗi gửi hàng loạt', 'error');
    } finally { setIsSending(false); }
  };

  const handleCancelSchedule = async (draftId, spaceId) => {
    try {
      setIsSending(true);
      const res = await taService.cancelSchedule(draftId, spaceId);
      if (res.success) { addToast('Đã hủy lịch'); fetchData(); }
    } catch (error) {
      console.error('handleCancelSchedule error:', error);
      addToast('Lỗi hủy lịch', 'error');
    } finally { setIsSending(false); }
  };

  const handleRefineAi = async (refineInstruction) => {
    if (!aiPreview || !selectedSpaces.length) return;
    setIsAnalyzing(true);
    try {
      const g = aiConfig.global;
      const pronouns = g.pronouns || "mình - bạn";
      
      const prompt = `[ROLE] Bạn là Trợ Giảng. Bạn đang chỉnh sửa lại một bản thảo do chính bạn viết.
[BẢN THẢO HIỆN TẠI]:
---
${aiPreview.content}
---
[YÊU CẦU HIỆU CHỈNH]: ${refineInstruction}
[RULES] BẮT BUỘC giữ nguyên cấu trúc xưng hô gốc (${pronouns}) và tuân thủ các quy tắc cơ bản:
${compileRules(g.rules)}
[OUTPUT FORMAT] CHỈ trả về bản thảo đã được sửa lại. TUYỆT ĐỐI KHÔNG nói luyên thuyên (như 'Dưới đây là bản sửa...', 'Vâng').`;

      const resAgent = await taService.callAgentChat(selectedSpaces[0], prompt, user?.id);
      
      const aiContent = resAgent?.answer || resAgent?.content || resAgent?.response;
      if (resAgent?.success && aiContent) {
        const res = await taService.updateSummaryDraft(aiPreview.id, selectedSpaces[0], { content: aiContent });
        if (res?.success) {
          setAiPreview(res.data);
          addToast('Đã cập nhật bản thảo!');
        }
      } else { addToast('AI không phản hồi lệnh sửa', 'error'); }
    } catch (error) {
      console.error('handleRefineAi error:', error);
      addToast('Lỗi hiệu chỉnh AI', 'error');
    } finally { setIsAnalyzing(false); }
  };

  const handleOpenCompose = async (snapshotId, spaceId) => {
    try {
      setLoading(true);
      const res = await taService.getAtRiskContext(snapshotId, spaceId);
      if (res.success) {
        setCurrentContext({ id: snapshotId, space_id: spaceId, ...res.data, aiConfig, taName: user?.display_name });
        setIsComposeOpen(true);
      }
    } catch (error) {
      console.error('handleOpenCompose error:', error);
      addToast('Lỗi mở compose', 'error');
    } finally { setLoading(false); }
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
    } catch (error) {
      console.error('handleAiSend error:', error);
      addToast('Lỗi gửi tin nhắn', 'error');
    } finally { setLoading(false); }
  };

  // Quiz handlers
  const handleGenerateQuiz = async (recapDraft = aiPreview, questionCount = 10) => {
    console.log('[Quiz] Starting generation:', { recapId: recapDraft?.id, questionCount });
    if (!selectedSpaces.length) {
      addToast('Vui lòng chọn lớp trước khi tạo quiz', 'error');
      return;
    }
    if (!recapDraft?.id) {
      addToast('Hãy tạo bản recap trước khi tạo quiz', 'error');
      return;
    }
    setGeneratingQuiz(true);
    try {
      console.log('[Quiz] Calling API with:', { space_id: selectedSpaces[0], recap_id: recapDraft.id, k_question: questionCount });
      const res = await taService.generateQuiz({
        space_id: selectedSpaces[0],
        recap_id: recapDraft.id,
        k_question: questionCount
      });
      console.log('[Quiz] API response:', res);
      if (res.success && res.data) {
        const actualCount = res.data.total_questions || questionCount;
        addToast(`Đã tạo quiz ${actualCount} câu từ bản recap!`);
        setCurrentQuizId(res.data.id);
        setQuizMode('edit');
        fetchData();
      } else {
        console.error('[Quiz] Invalid response or failed:', res);
        addToast(res.error || 'Lỗi tạo quiz: không nhận được dữ liệu hợp lệ', 'error');
      }
    } catch (error) {
      console.error('[Quiz] handleGenerateQuiz error:', {
        message: error?.message || String(error),
        response: error?.response?.data,
        status: error?.response?.status
      });
      addToast(`Lỗi: ${error?.message || 'Không thể tạo quiz'}`, 'error');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleEditQuiz = (quizId) => {
    setCurrentQuizId(quizId);
    setQuizMode('edit');
  };

  const handlePlayQuiz = (quizId) => {
    setCurrentQuizId(quizId);
    setQuizMode('play');
  };

  const handleViewResults = (quizId) => {
    setCurrentQuizId(quizId);
    setQuizMode('results');
  };

  const handleSendQuizFromList = async (quizId) => {
    if (!selectedSpaces.length) {
      addToast('Vui lòng chọn lớp học để gửi quiz', 'error');
      return;
    }

    if (!confirm('Bạn có chắc muốn gửi quiz này đến lớp học?')) {
      return;
    }

    setSendingQuizId(quizId);
    try {
      const res = await taService.sendQuiz(quizId, { space_id: selectedSpaces[0] });
      if (res?.success) {
        const roomName = res?.data?.room_name || 'room';
        const spaceName = res?.data?.space_name || 'lớp học';
        addToast(`Đã gửi quiz vào room "${roomName}" (${spaceName})!`);
        fetchData();
      } else {
        addToast(res?.error || 'Không thể gửi quiz', 'error');
      }
    } catch (error) {
      console.error('[Quiz] Send error:', error);
      addToast(error?.response?.data?.message || 'Lỗi khi gửi quiz', 'error');
    } finally {
      setSendingQuizId(null);
    }
  };

  const handleQuizSave = () => {
    addToast('Đã lưu quiz!');
    setQuizMode(null);
    fetchData();
  };

  const handleQuizSend = (data) => {
    const roomName = data?.room_name || 'room';
    const spaceName = data?.space_name || 'lớp học';
    addToast(`Đã gửi quiz vào room "${roomName}" (${spaceName})!`);
    setQuizMode('results');
    fetchData();
  };

  const handleStudentPlayQuiz = (quizId) => {
    setStudentQuizId(quizId);
    setStudentQuizOpen(true);
  };

  const handleStudentQuizClose = () => {
    setStudentQuizOpen(false);
    setStudentQuizId(null);
  };

  const handleQuizCompleteFromModal = () => {
    handleStudentQuizClose();
    addToast('Đã hoàn thành quiz!');
  };

  const handleQuizComplete = () => {
    addToast('Đã hoàn thành quiz!');
    setQuizMode(null);
  };

  const handleDeleteQuizFromList = async (quizId) => {
    if (!confirm('Bạn có chắc muốn xóa quiz này? Hành động này không thể hoàn tác.')) return;
    try {
      await taService.updateQuiz(quizId, { status: 'archived' });
      addToast('Đã xóa quiz!');
      fetchData();
    } catch (error) {
      addToast('Không thể xóa quiz', 'error');
    }
  };

  const handleRecallQuiz = async (quizId) => {
    if (!confirm('Bạn có chắc muốn thu hồi quiz này? Học viên sẽ không thể làm quiz nữa.')) return;
    try {
      await taService.updateQuiz(quizId, { status: 'draft' });
      addToast('Đã thu hồi quiz!');
      fetchData();
    } catch (error) {
      addToast('Không thể thu hồi quiz', 'error');
    }
  };

  const handleRestoreQuiz = async (quizId) => {
    try {
      await taService.updateQuiz(quizId, { status: 'draft' });
      addToast('Đã khôi phục quiz!');
      fetchData();
    } catch (error) {
      addToast('Không thể khôi phục quiz', 'error');
    }
  };

  const visibleQuizList = selectedSpaces.length > 0
    ? quizList.filter(quiz => selectedSpaces.includes(quiz.space_id))
    : quizList;

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
      <QuizPlayer displayMode="modal" isOpen={studentQuizOpen} quizId={studentQuizId} onClose={handleStudentQuizClose} onComplete={handleQuizCompleteFromModal} />

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
                  <div style={{ width: '100%', minWidth: 0, height: 220, minHeight: 220 }}>
                    <ResponsiveContainer width="100%" height={220} minWidth={0}>
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
                  {filteredAtRiskList.length > 0 ? (
                    filteredAtRiskList.map(student => (
                      <RiskCard
                        key={student.id} student={student} spaceName={taSpaces.find(s => s.id === student.space_id)?.name || spaces.find(s => s.id === student.space_id)?.name}
                        onResolve={handleResolveAlert} onGetContext={handleOpenCompose}
                        formatOfflineTime={(s) => {
                          const hours = Math.floor(s.hours_since_active || 0);
                          return hours === 0 ? 'Vừa mới' : (hours < 24 ? `${hours} giờ` : `${Math.floor(hours/24)} ngày`);
                        }}
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
                    if (res.success) {
                      setUploadedFile({ ...res.data, rawFile: file });
                      // Index PDF vào Qdrant (background, không blocking)
                      (async () => {
                        try {
                          const indexRes = await taService.indexPdf(selectedSpaces[0], `room-${selectedSpaces[0]}`, file);
                          if (indexRes.success) {
                            console.log('[Slide] Indexed', indexRes.chunksIndexed, 'chunks');
                          } else {
                            console.warn('[Slide] Index failed:', indexRes.error);
                          }
                        } catch (err) {
                          console.error('[Slide] Index failed:', err);
                          // Thông báo người dùng: file đã upload nhưng index thất bại
                          addToast('Slide đã tải lên nhưng không index được vào tìm kiếm', 'error');
                        }
                      })();
                    }
                  } catch (error) {
                    console.error('handleFileUpload error:', error);
                    addToast('Lỗi tải file lên', 'error');
                  } finally { setUploading(false); }
                }} 
                startAiAnalysis={async () => {
                  if (selectedSpaces.length === 0) {
                    console.warn('[Recap] No space selected');
                    return;
                  }

                  console.log('[Recap] Starting analysis:', {
                    selectedSpaces,
                    hasFile: !!uploadedFile,
                    fileName: uploadedFile?.filename,
                    isHitlEnabled: aiConfig.isHitlEnabled
                  });

                  if (!aiConfig.isHitlEnabled) {
                    addToast('Đã giao AI xử lý nền. Bạn có thể làm việc khác!');
                    setCurrentStep(1); setUploadedFile(null);
                    // Chạy ngầm (Background Task)
                    (async () => {
                      try {
                        const prompt = buildRecapPrompt();
                        console.log('[Recap] Prompt built:', prompt.substring(0, 200) + '...');

                        let resAgent;
                        if (uploadedFile && uploadedFile.rawFile) {
                          console.log('[Recap] Calling agent WITH file:', uploadedFile.rawFile.name, uploadedFile.rawFile.size, 'bytes');
                          resAgent = await taService.callAgentWithFile(selectedSpaces[0], prompt, user?.id || 'TA', uploadedFile.rawFile);
                        } else {
                          console.log('[Recap] Calling agent WITHOUT file');
                          resAgent = await taService.callAgentChat(selectedSpaces[0], prompt, user?.id || 'TA');
                        }

                        console.log('[Recap] Agent response:', resAgent);

                        const aiContent = resAgent?.answer || resAgent?.content || resAgent?.response;
                        if (resAgent?.success && aiContent) {
                          const parsed = parseAiRecapResponse(aiContent);
                          console.log('[Recap] Parsed recap:', { summaryLength: parsed.summary?.length, deadlinesCount: parsed.deadlines?.length });

                          const res = await taService.createSummaryDraft({
                            spaceId: selectedSpaces[0],
                            content: parsed.summary,
                            draft_type: 'lesson_recap',
                            metadata: { deadlines: parsed.deadlines }
                          });
                          console.log('[Recap] Draft created:', res);
                          if (res?.success && res?.data) {
                            if (scheduleDate) handleScheduleSummary(res.data.id, res.data.space_id, scheduleDate, res.data);
                            else handleApproveSummary(res.data.id, res.data.space_id, res.data);
                          } else {
                            console.error('[Recap] Draft creation failed or no data:', res);
                          }
                        } else {
                          console.error('[Recap] Agent failed or no content:', resAgent);
                        }
                      } catch(e) {
                        console.error('[Recap] Background task error:', e);
                      }
                    })();
                    return;
                  }

                  setCurrentStep(2); setIsAnalyzing(true);
                  try {
                    const prompt = buildRecapPrompt();
                    console.log('[Recap] Prompt built:', prompt.substring(0, 200) + '...');

                    let resAgent;
                    if (uploadedFile && uploadedFile.rawFile) {
                      console.log('[Recap] Calling agent WITH file:', uploadedFile.rawFile.name, uploadedFile.rawFile.size, 'bytes');
                      resAgent = await taService.callAgentWithFile(selectedSpaces[0], prompt, user?.id || 'TA', uploadedFile.rawFile);
                    } else {
                      console.log('[Recap] Calling agent WITHOUT file');
                      resAgent = await taService.callAgentChat(selectedSpaces[0], prompt, user?.id || 'TA');
                    }

                    console.log('[Recap] Agent response:', resAgent);

                    const aiContent = resAgent?.answer || resAgent?.content || resAgent?.response;
                    if (resAgent?.success && aiContent) {
                      const parsed = parseAiRecapResponse(aiContent);
                      console.log('[Recap] Parsed recap:', { summaryLength: parsed.summary?.length, deadlinesCount: parsed.deadlines?.length });

                      const res = await taService.createSummaryDraft({
                        spaceId: selectedSpaces[0],
                        content: parsed.summary,
                        draft_type: 'lesson_recap',
                        metadata: { deadlines: parsed.deadlines }
                      });
                      console.log('[Recap] Draft created:', res);
                      if (res?.success && res?.data) {
                        setAiPreview({ ...res.data, deadlines: parsed.deadlines });
                        setCurrentStep(3);
                      } else {
                        console.error('[Recap] Draft creation failed or no data:', res);
                        addToast(res?.error || 'Lỗi tạo bản thảo', 'error');
                      }
                    } else {
                      console.error('[Recap] Agent failed or no content:', resAgent);
                      const errorMsg = resAgent?.error || 'AI không trả về nội dung hợp lệ';
                      addToast(errorMsg, 'error');
                    }
                  } catch (error) {
                    console.error('[Recap] Analysis error:', error);
                    addToast(error.message || 'Lỗi khi phân tích AI', 'error');
                    setCurrentStep(1);
                  } finally {
                    setIsAnalyzing(false);
                  }
                }}
                aiPreview={aiPreview} scheduleDate={scheduleDate} setScheduleDate={setScheduleDate} handleApproveSummary={handleApproveSummary} setCurrentStep={setCurrentStep}
                setAiPreview={setAiPreview} handleScheduleSummary={handleScheduleSummary} selectedSpaces={selectedSpaces || []} setSelectedSpaces={setSelectedSpaces}
                taSpaces={taSpaces || []} handleRefineAi={handleRefineAi}
                onGenerateQuiz={handleGenerateQuiz}
                generatingQuiz={generatingQuiz}
              />

              {/* Quiz Section */}
              {quizMode === 'edit' && currentQuizId && (
                <QuizWorkflow
                  quizId={currentQuizId}
                  spaceId={selectedSpaces[0]}
                  onBack={() => { setQuizMode(null); setCurrentQuizId(null); }}
                  onSave={handleQuizSave}
                  onSend={handleQuizSend}
                  onViewResults={handleViewResults}
                />
              )}

              {quizMode === 'play' && currentQuizId && (
                <QuizPlayer
                  quizId={currentQuizId}
                  onComplete={handleQuizComplete}
                />
              )}

              {quizMode === 'results' && currentQuizId && (
                <QuizResults
                  quizId={currentQuizId}
                  onBack={() => { setQuizMode(null); setCurrentQuizId(null); }}
                />
              )}

              {quizMode === null && (
                <div className="ta-card-premium" style={{ marginTop: '24px' }}>
                  <div className="card-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiBarChart2 /> Bảng điểm quiz
                    </h3>
                    <span className="ta-badge">{visibleQuizList.length} quiz</span>
                  </div>
                  <div className="ta-card-body" style={{ padding: '12px 0' }}>
                    {visibleQuizList.length > 0 ? (
                      visibleQuizList.map((quiz) => {
                        const isPublished = quiz.status === 'published';
                        return (
                          <div key={quiz.id} className="ta-list-row" style={{ alignItems: 'center', gap: '16px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{quiz.title || 'Quiz'}</strong>
                                <span className={`ta-badge ${isPublished ? 'badge-green' : 'badge-amber'}`}>
                                  {isPublished ? 'Đã gửi' : 'Bản nháp'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                <span><FiLayers size={12} /> {quiz.space_name || 'Lớp học'}</span>
                                <span><FiFileText size={12} /> {quiz.total_questions || 0} câu hỏi</span>
                                <span><FiUser size={12} /> {quiz.total_attempts || 0} bài nộp</span>
                                <span><FiCheckCircle size={12} /> TB {quiz.average_score || 0} điểm</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                              {quiz.status === 'published' ? (
                                <>
                                  <button
                                    className="ta-btn"
                                    style={{ padding: '8px 12px', fontSize: '12px', minWidth: '80px', color: 'var(--ta-amber)' }}
                                    onClick={() => handleRecallQuiz(quiz.id)}
                                    title="Thu hồi quiz - Học viên không thể làm nữa"
                                  >
                                    <FiArrowLeft /> Thu hồi
                                  </button>
                                  <button
                                    className="vibrant-btn"
                                    style={{ padding: '8px 12px', fontSize: '12px' }}
                                    onClick={() => handleViewResults(quiz.id)}
                                  >
                                    <FiBarChart2 /> Kết quả
                                  </button>
                                </>
                              ) : quiz.status === 'draft' ? (
                                <>
                                  <button
                                    className="vibrant-btn"
                                    style={{ padding: '8px 12px', fontSize: '12px', minWidth: '80px' }}
                                    onClick={() => handleSendQuizFromList(quiz.id)}
                                    disabled={sendingQuizId === quiz.id}
                                  >
                                    {sendingQuizId === quiz.id ? (
                                      <FiRefreshCw className="spin" />
                                    ) : (
                                      <>
                                        <FiSend /> Gửi ngay
                                      </>
                                    )}
                                  </button>
                                  <button className="ta-btn" onClick={() => handleEditQuiz(quiz.id)} title="Sửa quiz">
                                    <FiEdit3 />
                                  </button>
                                  <button
                                    className="ta-btn"
                                    onClick={() => handleDeleteQuizFromList(quiz.id)}
                                    title="Lưu trữ quiz"
                                    style={{ color: 'var(--ta-red)' }}
                                  >
                                    <FiArchive />
                                  </button>
                                </>
                              ) : (
                                // archived status
                                <>
                                  <button
                                    className="ta-btn"
                                    style={{ padding: '8px 12px', fontSize: '12px', minWidth: '80px', color: 'var(--ta-green)' }}
                                    onClick={() => handleRestoreQuiz(quiz.id)}
                                    title="Khôi phục quiz về draft"
                                  >
                                    <FiRotateCcw /> Khôi phục
                                  </button>
                                  <button
                                    className="ta-btn"
                                    onClick={() => handleEditQuiz(quiz.id)}
                                    title="Xem chi tiết"
                                  >
                                    <FiEye />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-state">
                        <FiBarChart2 size={42} style={{ opacity: 0.2, marginBottom: '12px' }} />
                        <p>Chưa có quiz nào. Tạo recap xong rồi bấm tạo quiz từ recap.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <ScheduledQueueList queue={summaryQueue.filter(q => q.draft_type === 'lesson_recap')} taSpaces={spaces} onEdit={handleEditScheduled} onSendNow={handleApproveSummary} onCancelSchedule={handleCancelSchedule} onBulkCancel={handleBulkCancel} onBulkSendNow={handleBulkSendNow} isLoading={isSending} />
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="animate-fade">
              <AnnouncementWorkflow 
                isHitlEnabled={aiConfig.isHitlEnabled}
                onGenerate={async (p, c) => {
                  if (selectedSpaces.length === 0) return;

                  if (!aiConfig.isHitlEnabled) {
                    addToast('Đã giao AI xử lý nền. Bạn có thể làm việc khác!');
                    (async () => {
                      try {
                        const prompt = buildAnnouncementPrompt(p, c);
                        const resAgent = await taService.callAgentChat(selectedSpaces[0], prompt, user?.id || 'TA');
                        const aiContent = resAgent?.answer || resAgent?.content || resAgent?.response;
                        if (resAgent?.success && aiContent) {
                          const res = await taService.createSummaryDraft({ spaceId: selectedSpaces[0], content: aiContent, draft_type: 'announcement' });
                          if (res?.success) { 
                            if (scheduleDate) handleScheduleSummary(res.data.id, res.data.space_id, scheduleDate, res.data);
                            else handleApproveSummary(res.data.id, res.data.space_id, res.data);
                          }
                        }
                      } catch(e) {}
                    })();
                    return;
                  }

                  setIsAnalyzing(true);
                  try {
                    const prompt = buildAnnouncementPrompt(p, c);
                    const resAgent = await taService.callAgentChat(selectedSpaces[0], prompt, user?.id || 'TA');
                    
                    const aiContent = resAgent?.answer || resAgent?.content || resAgent?.response;
                    if (resAgent?.success && aiContent) {
                      const res = await taService.createSummaryDraft({ spaceId: selectedSpaces[0], content: aiContent, draft_type: 'announcement' });
                      if (res?.success) { 
                        setAiPreview(res.data); 
                      }
                    } else { addToast('AI không phản hồi', 'error'); }
                  } catch (error) {
      console.error('Announcement AI error:', error);
      addToast('Lỗi khi soạn thông báo', 'error');
    } finally { setIsAnalyzing(false); }
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
              
              {/* 0. HITL CONTROL */}
              <div className="ta-card-premium" style={{ border: configDraft.isHitlEnabled ? '1px solid var(--primary)' : '1px solid var(--border-primary)', transition: '0.3s' }}>
                <div className="ta-card-body" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, paddingRight: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: configDraft.isHitlEnabled ? 'var(--primary)' : 'var(--text-primary)' }}>
                      <FiUser color={configDraft.isHitlEnabled ? "var(--primary)" : "var(--text-muted)"} /> 
                      Kiểm duyệt thủ công (Human-in-the-Loop)
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Bật để xem trước và có cơ hội chỉnh sửa nội dung do AI soạn. Nếu tắt, AI sẽ được cấp quyền tự động gửi ngay lập tức sau khi tạo xong (Auto-Pilot).
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: configDraft.isHitlEnabled ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {configDraft.isHitlEnabled ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
                    </span>
                    <div style={{ position: 'relative', width: '48px', height: '26px', background: configDraft.isHitlEnabled ? 'var(--primary)' : 'var(--bg-surface-tertiary)', border: configDraft.isHitlEnabled ? 'none' : '1px solid var(--border-primary)', borderRadius: '13px', transition: '0.3s' }}>
                      <div style={{ position: 'absolute', top: configDraft.isHitlEnabled ? '3px' : '2px', left: configDraft.isHitlEnabled ? '25px' : '2px', width: '20px', height: '20px', background: configDraft.isHitlEnabled ? 'white' : 'var(--text-muted)', borderRadius: '50%', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                    </div>
                    <input type="checkbox" checked={configDraft.isHitlEnabled} onChange={e => setConfigDraft({...configDraft, isHitlEnabled: e.target.checked})} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

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
