import React, { useState, useRef, useEffect } from 'react';
import {
  RiSendPlaneLine,
  RiUser3Line,
  RiRobotLine,
  RiAttachmentLine,
  RiMicLine,
  RiStopLine,
  RiMoreLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiThumbUpLine,
  RiThumbDownLine,
  RiRefreshLine
} from 'react-icons/ri';
import styles from './ChatBox.module.scss';

const ChatBox = ({
  messages = [],
  onSendMessage,
  loading = false,
  streaming = false,
  streamingText = '',
  placeholder = 'Type your message...',
  showAttachments = true,
  showVoice = true,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;
    
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    console.log('Files selected:', files);
    // Handle file upload logic here
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      // Stop recording logic
    } else {
      setIsRecording(true);
      // Start recording logic
    }
  };

  const handleMessageAction = (action, messageId, content) => {
    switch (action) {
      case 'copy':
        navigator.clipboard.writeText(content);
        break;
      case 'delete':
        console.log('Delete message:', messageId);
        break;
      case 'thumbsUp':
        console.log('Thumbs up:', messageId);
        break;
      case 'thumbsDown':
        console.log('Thumbs down:', messageId);
        break;
      case 'regenerate':
        console.log('Regenerate:', messageId);
        break;
      default:
        break;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';

    return (
      <div
        key={message.id || index}
        className={`${styles.messageWrapper} ${isUser ? styles.userMessage : styles.assistantMessage}`}
      >
        <div className={styles.messageAvatar}>
          {isUser ? (
            <div className={styles.userAvatar}>
              <RiUser3Line />
            </div>
          ) : (
            <div className={styles.assistantAvatar}>
              <RiRobotLine />
            </div>
          )}
        </div>

        <div className={styles.messageContent}>
          <div className={styles.messageHeader}>
            <span className={styles.messageSender}>
              {isUser ? 'You' : 'Campus AI Assistant'}
            </span>
            <span className={styles.messageTime}>
              {formatTime(message.timestamp)}
            </span>
          </div>

          <div className={styles.messageBody}>
            <p>{message.content}</p>
          </div>

          {isAssistant && (
            <div className={styles.messageActions}>
              <button
                onClick={() => handleMessageAction('copy', message.id, message.content)}
                className={styles.actionButton}
                title="Copy message"
              >
                <RiFileCopyLine />
              </button>
              <button
                onClick={() => handleMessageAction('thumbsUp', message.id)}
                className={styles.actionButton}
                title="Good response"
              >
                <RiThumbUpLine />
              </button>
              <button
                onClick={() => handleMessageAction('thumbsDown', message.id)}
                className={styles.actionButton}
                title="Poor response"
              >
                <RiThumbDownLine />
              </button>
              <button
                onClick={() => handleMessageAction('regenerate', message.id)}
                className={styles.actionButton}
                title="Regenerate response"
              >
                <RiRefreshLine />
              </button>
              <div className={styles.dropdownWrapper}>
                <button className={styles.actionButton} title="More actions">
                  <RiMoreLine />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTypingIndicator = () => (
    <div className={`${styles.messageWrapper} ${styles.assistantMessage}`}>
      <div className={styles.messageAvatar}>
        <div className={styles.assistantAvatar}>
          <RiRobotLine />
        </div>
      </div>
      <div className={styles.messageContent}>
        <div className={styles.messageHeader}>
          <span className={styles.messageSender}>Campus AI Assistant</span>
          <span className={styles.typingIndicator}>is typing...</span>
        </div>
        {streaming && streamingText ? (
          <div className={styles.messageBody}>
            <p>{streamingText}<span className={styles.cursor}>|</span></p>
          </div>
        ) : (
          <div className={styles.typingDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`${styles.chatBox} ${className}`}>
      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerInfo}>
          <div className={styles.assistantInfo}>
            <div className={styles.assistantAvatar}>
              <RiRobotLine />
            </div>
            <div className={styles.assistantDetails}>
              <h3>Campus AI Assistant</h3>
              <span className={styles.status}>
                <span className={styles.statusDot}></span>
                Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <RiRobotLine />
            </div>
            <h3>Welcome to Campus AI Assistant!</h3>
            <p>I'm here to help you with student information, campus resources, and administrative tasks. How can I assist you today?</p>
            <div className={styles.suggestedQueries}>
              <button onClick={() => setInputValue('Show me student enrollment statistics')}>
                📊 Student Statistics
              </button>
              <button onClick={() => setInputValue('How do I add a new student?')}>
                👥 Add New Student
              </button>
              <button onClick={() => setInputValue('What are the most active departments?')}>
                🏢 Department Activity
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((message, index) => renderMessage(message, index))}
            {loading && renderTypingIndicator()}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Container */}
      <div className={styles.inputContainer}>
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <div className={styles.inputWrapper}>
            {showAttachments && (
              <div className={styles.inputAction}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className={styles.fileInput}
                  multiple
                  accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={styles.actionButton}
                  title="Attach files"
                >
                  <RiAttachmentLine />
                </button>
              </div>
            )}

            <div className={styles.textInputWrapper}>
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                className={styles.textInput}
                rows={1}
                disabled={loading}
              />
            </div>

            <div className={styles.inputActions}>
              {showVoice && (
                <button
                  type="button"
                  onClick={handleVoiceRecord}
                  className={`${styles.actionButton} ${isRecording ? styles.recording : ''}`}
                  title={isRecording ? 'Stop recording' : 'Voice message'}
                >
                  {isRecording ? <RiStopLine /> : <RiMicLine />}
                </button>
              )}

              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className={`${styles.sendButton} ${inputValue.trim() ? styles.active : ''}`}
                title="Send message"
              >
                <RiSendPlaneLine />
              </button>
            </div>
          </div>
        </form>

        <div className={styles.inputFooter}>
          <p>AI Assistant can make mistakes. Please verify important information.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;