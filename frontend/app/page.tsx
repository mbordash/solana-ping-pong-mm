'use client';

import { useState } from 'react';
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const DEFAULT_PASSWORD = process.env.NEXT_PUBLIC_API_PASSWORD || '';

function getAuthHeader(password: string) {
  return 'Basic ' + btoa('admin:' + password);
}

export default function Dashboard() {
  const [password, setPassword] = useState<string>(DEFAULT_PASSWORD);
  const [showPrompt, setShowPrompt] = useState(!DEFAULT_PASSWORD);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Custom fetcher with auth
  const fetcher = (url: string) =>
    fetch(url, {
      headers: password ? { Authorization: getAuthHeader(password) } : {},
    }).then((res) => {
      if (res.status === 401) throw new Error('Unauthorized');
      return res.json();
    });

  const { data: status, mutate: mutateStatus } = useSWR(
    password ? `${API_URL}/status` : null,
    fetcher,
    { refreshInterval: 2000 }
  );
  const { data: config } = useSWR(password ? `${API_URL}/config` : null, fetcher);

  const handleStart = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/start`, {
        method: 'POST',
        headers: { Authorization: getAuthHeader(password) },
      });
      await mutateStatus();
    } catch (err) {
      console.error('Error starting bot:', err);
    }
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/stop`, {
        method: 'POST',
        headers: { Authorization: getAuthHeader(password) },
      });
      await mutateStatus();
    } catch (err) {
      console.error('Error stopping bot:', err);
    }
    setLoading(false);
  };

  // Password prompt modal
  if (showPrompt) {
    return (
      <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center', display: 'flex', minHeight: '100vh' }}>
        <div style={{ background: '#1e293b', padding: 32, borderRadius: 8, boxShadow: '0 2px 16px #0008', minWidth: 320 }}>
          <h2 style={{ color: '#fff', marginBottom: 16 }}>Dashboard Login</h2>
          <input
            type="password"
            placeholder="Enter password"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #334155', marginBottom: 16, background: '#0f172a', color: '#fff' }}
            onKeyDown={e => { if (e.key === 'Enter') { setPassword(input); setShowPrompt(false); } }}
            autoFocus
          />
          <button
            style={{ ...styles.button, ...styles.buttonPrimary, width: '100%' }}
            onClick={() => { setPassword(input); setShowPrompt(false); }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🤖 Solana MM Dashboard</h1>
        <p style={styles.subtitle}>Market Maker Status & Control</p>
      </div>

      {/* Status Card */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Bot Status</h2>
        <div style={styles.statusBox}>
          <div style={styles.statusIndicator}>
            <span
              style={{
                ...styles.statusDot,
                backgroundColor: status?.running ? '#10b981' : '#ef4444',
              }}
            />
            <span style={styles.statusText}>
              {status?.running ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
          <div style={styles.controls}>
            <button
              onClick={handleStart}
              disabled={status?.running || loading}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                opacity: status?.running || loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Loading...' : 'Start'}
            </button>
            <button
              onClick={handleStop}
              disabled={!status?.running || loading}
              style={{
                ...styles.button,
                ...styles.buttonDanger,
                opacity: !status?.running || loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Loading...' : 'Stop'}
            </button>
          </div>
        </div>
        <div style={styles.stats}>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Total Trades:</span>
            <span style={styles.statValue}>{status?.totalTrades || 0}</span>
          </div>
        </div>
      </div>

      {/* Configuration Card */}
      {config && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Configuration</h2>
          <div style={styles.configGrid}>
            <div style={styles.configItem}>
              <label>Trade Amount:</label>
              <span>{config.TRADE_AMOUNT_SOL} SOL</span>
            </div>
            <div style={styles.configItem}>
              <label>Price Change Threshold:</label>
              <span>{(config.PRICE_CHANGE_THRESHOLD * 100).toFixed(2)}%</span>
            </div>
            <div style={styles.configItem}>
              <label>Loop Delay:</label>
              <span>{config.LOOP_DELAY_MS / 1000}s</span>
            </div>
            <div style={styles.configItem}>
              <label>Slippage:</label>
              <span>{config.SLIPPAGE_BPS} BPS</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Trades */}
      {status?.trades && status.trades.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Recent Trades</h2>
          <div style={styles.tradesTable}>
            <div style={styles.tradesHeader}>
              <div style={styles.tradeCell}>Type</div>
              <div style={styles.tradeCell}>Time</div>
              <div style={styles.tradeCell}>Details</div>
            </div>
            {status.trades.map((trade: any, idx: number) => (
              <div key={idx} style={styles.tradeRow}>
                <div style={styles.tradeCell}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor:
                        trade.type === 'BUY' ? '#dcfce7' : '#fecaca',
                      color: trade.type === 'BUY' ? '#166534' : '#991b1b',
                      fontWeight: 'bold',
                      fontSize: '12px',
                    }}
                  >
                    {trade.type}
                  </span>
                </div>
                <div style={styles.tradeCell}>
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </div>
                <div style={styles.tradeCell}>{trade.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!status?.trades || status.trades.length === 0 && (
        <div style={styles.card}>
          <p style={styles.emptyText}>No trades yet. Start the bot to begin.</p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#0f172a',
    minHeight: '100vh',
    color: '#e2e8f0',
  },
  header: {
    marginBottom: '32px',
    textAlign: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#fff',
  },
  subtitle: {
    fontSize: '16px',
    color: '#94a3b8',
    margin: 0,
  },
  card: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 16px 0',
    color: '#f1f5f9',
  },
  statusBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  controls: {
    display: 'flex',
    gap: '12px',
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonPrimary: {
    backgroundColor: '#10b981',
    color: '#fff',
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
    color: '#fff',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    paddingTop: '16px',
    borderTop: '1px solid #334155',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginTop: '4px',
  },
  configGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  configItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    backgroundColor: '#0f172a',
    borderRadius: '6px',
  },
  tradesTable: {
    borderRadius: '6px',
    overflow: 'hidden',
  },
  tradesHeader: {
    display: 'grid',
    gridTemplateColumns: '80px 150px 1fr',
    gap: '16px',
    padding: '12px',
    backgroundColor: '#0f172a',
    fontWeight: 'bold',
    borderBottom: '1px solid #334155',
  },
  tradeRow: {
    display: 'grid',
    gridTemplateColumns: '80px 150px 1fr',
    gap: '16px',
    padding: '12px',
    borderBottom: '1px solid #334155',
    fontSize: '14px',
  },
  tradeCell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    margin: 0,
  },
};
