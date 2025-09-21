import React, { useEffect, useRef, useState } from 'react';
import {
  RiSettingsLine,
  RiRefreshLine,
  RiDownloadLine,
  RiDeleteBinLine,
  RiHistoryLine,
  RiChat3Line
} from 'react-icons/ri';
import { api } from '../api';
import ChatBox from '../components/ChatBox';
import Card, { StatsCard } from '../components/Card';
import styles from './Chat.module.scss';

function useSSE(url, onMessage, onOpen, onError) {
  const sourceRef = useRef(null);

  useEffect(() => {
    if (!url) return;
    const source = new EventSource(url);
    sourceRef.current = source;

    source.onopen = () => onOpen && onOpen();
    source.onerror = (e) => onError && onError(e);

    source.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onMessage && onMessage(data);
      } catch (e) {
        // ignore malformed chunk
      }
    };

    return () => {
      source.close();
    };
  }, [url]);

  return { close: () => sourceRef.current?.close() };
}

export default function Chat() {
  const [sessionId, setSessionId] = useState('demo-session');
  const [history, setHistory] = useState([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m the Campus AI Assistant. I can help you with student information, enrollment statistics, department details, and administrative tasks. What would you like to know?',
      timestamp: new Date(Date.now() - 300000).toISOString()
    }
  ]);
  const [stream, setStream] = useState(true);
  const [loading, setLoading] = useState(false);
  const [partial, setPartial] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [chatStats, setChatStats] = useState({
    totalMessages: 156,
    activeSessions: 23,
    avgResponseTime: '1.2s',
    satisfaction: 94.5
  });

  // Accumulate streamed text in a ref to avoid stale state issues
  const partialRef = useRef('');

  const sseUrl = stream && loading
    ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/chat/stream?session_id=${encodeURIComponent(sessionId)}&message=${encodeURIComponent(currentMessage)}`
    : null;

  useSSE(
    sseUrl,
    (data) => {
      if (data.type === 'message_start') {
        // reset accumulators at the start of a streamed message
        partialRef.current = '';
        setPartial('');
      } else if (data.type === 'token') {
        // append token to both ref (source of truth) and state (for typing view)
        const chunk = data.value || '';
        if (chunk) {
          partialRef.current += chunk;
          setPartial((p) => p + chunk);
        }
      } else if (data.type === 'message_end') {
        const finalText = partialRef.current;

        const newUserMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: currentMessage,
          timestamp: new Date().toISOString()
        };
        const newAssistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: finalText,
          timestamp: new Date().toISOString()
        };
        setHistory((h) => [...h, newUserMessage, newAssistantMessage]);
        setLoading(false);
        setPartial('');
        partialRef.current = '';
        setCurrentMessage('');
        
        // Update stats
        setChatStats(prev => ({
          ...prev,
          totalMessages: prev.totalMessages + 1
        }));
      }
    },
    null,
    () => {
      // onError: end loading and clear partial typing view but do not mutate history
      setLoading(false);
      setPartial('');
      partialRef.current = '';
    }
  );

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    
    setCurrentMessage(message);
    setLoading(true);
    
    if (!stream) {
      try {
        const res = await api.post('/chat', { 
          session_id: sessionId, 
          message 
        });
        const reply = res.data.reply || 'I apologize, but I couldn\'t process your request at the moment. Please try again or contact support if the issue persists.';
        
        const newUserMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        };
        const newAssistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString()
        };
        
        setHistory((h) => [...h, newUserMessage, newAssistantMessage]);
        
        // Update stats
        setChatStats(prev => ({
          ...prev,
          totalMessages: prev.totalMessages + 1
        }));
      } catch (e) {
        // Fallback with mock response
        const mockResponses = [
          'I understand you\'re looking for information. Based on our current data, I can help you with student enrollment statistics, department information, and administrative queries.',
          'Thank you for your question. Let me provide you with some relevant campus information that might be helpful.',
          'I\'m here to assist with campus administration. While I don\'t have access to real-time data at the moment, I can guide you through common administrative processes.',
          'Your inquiry is important to us. For detailed student information and analytics, I recommend checking the Dashboard or Analytics sections for comprehensive data.'
        ];
        
        const mockReply = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        
        const newUserMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        };
        const newAssistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: mockReply,
          timestamp: new Date().toISOString()
        };
        
        setHistory((h) => [...h, newUserMessage, newAssistantMessage]);
      } finally {
        setLoading(false);
        setCurrentMessage('');
      }
    }
  };

  const handleClearHistory = () => {
    setHistory([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m the Campus AI Assistant. I can help you with student information, enrollment statistics, department details, and administrative tasks. What would you like to know?',
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const handleExportChat = () => {
    const chatData = {
      sessionId,
      messages: history,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campus-chat-${sessionId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.chatPage}>
      {/* Chat Header */}
      <div className={styles.chatPageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1>AI Chat Assistant</h1>
            <p>Interact with our intelligent campus administration assistant</p>
          </div>
          <div className={styles.headerActions}>
            <button 
              onClick={handleClearHistory}
              className={styles.actionButton}
              title="Clear chat history"
            >
              <RiDeleteBinLine /> Clear
            </button>
            <button 
              onClick={handleExportChat}
              className={styles.actionButton}
              title="Export chat history"
            >
              <RiDownloadLine /> Export
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`${styles.actionButton} ${showSettings ? styles.active : ''}`}
              title="Chat settings"
            >
              <RiSettingsLine /> Settings
            </button>
          </div>
        </div>
      </div>

      {/* Chat Stats */}
      <div className={styles.chatStats}>
        <StatsCard
          value={chatStats.totalMessages}
          label="Total Messages"
          change={12.3}
          changeType="positive"
          icon={RiChat3Line}
        />
        <StatsCard
          value={chatStats.activeSessions}
          label="Active Sessions"
          change={5.7}
          changeType="positive"
          icon={RiHistoryLine}
        />
        <StatsCard
          value={chatStats.avgResponseTime}
          label="Avg Response Time"
          change={-8.2}
          changeType="positive"
          icon={RiRefreshLine}
        />
        <StatsCard
          value={`${chatStats.satisfaction}%`}
          label="Satisfaction Rate"
          change={2.1}
          changeType="positive"
          icon={RiSettingsLine}
        />
      </div>

      {/* Main Chat Layout */}
      <div className={styles.chatLayout}>
        {/* Chat Interface */}
        <div className={styles.chatMain}>
          <ChatBox
            messages={history}
            onSendMessage={handleSendMessage}
            loading={loading}
            streaming={stream && loading}
            streamingText={partial}
            placeholder="Ask me about students, departments, enrollment, or any campus-related questions..."
            className={styles.mainChatBox}
          />
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={styles.settingsPanel}>
            <Card title="Chat Settings" className={styles.settingsCard}>
              <div className={styles.settingsList}>
                <div className={styles.settingItem}>
                  <label htmlFor="session-id">Session ID</label>
                  <input
                    id="session-id"
                    type="text"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    placeholder="Enter session ID"
                  />
                </div>
                
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <label>Streaming Mode</label>
                    <p>Enable real-time response streaming</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={stream}
                      onChange={(e) => setStream(e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
                
                <div className={styles.settingActions}>
                  <button onClick={() => setSessionId(`session-${Date.now()}`)}>
                    <RiRefreshLine /> New Session
                  </button>
                </div>
              </div>
            </Card>
            
            <Card title="Chat History" className={styles.historyCard}>
              <div className={styles.historyStats}>
                <div className={styles.historyItem}>
                  <span className={styles.historyLabel}>Messages Today</span>
                  <span className={styles.historyValue}>{history.length}</span>
                </div>
                <div className={styles.historyItem}>
                  <span className={styles.historyLabel}>Current Session</span>
                  <span className={styles.historyValue}>{sessionId}</span>
                </div>
              </div>
              
              <div className={styles.historyActions}>
                <button onClick={handleExportChat}>
                  <RiDownloadLine /> Export History
                </button>
                <button onClick={handleClearHistory}>
                  <RiDeleteBinLine /> Clear History
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
