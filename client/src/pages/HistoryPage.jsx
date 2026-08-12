import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HistoryList from '../components/HistoryList.jsx';
import CodeEditor from '../components/CodeEditor.jsx';
import { getHistory, deleteHistoryItem, clearHistory } from '../services/historyService.js';
import '../styles/history.css';

function HistoryPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => { fetchHistory(); }, [currentPage]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await getHistory(currentPage, ITEMS_PER_PAGE);
      const payload = res.data ?? res;
      setEntries(payload.entries || []);
      setTotalPages(payload.totalPages || 1);
      setTotalEntries(payload.totalEntries || 0);
    } catch {
      toast.error('Failed to load history');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteHistoryItem(id);
      toast.success("Deleted");
      if (selectedEntry?._id === id) setSelectedEntry(null);
      fetchHistory();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete all history?")) return;
    try {
      const r = await clearHistory();
      toast.success(`Cleared ${r.deletedCount} entries`);
      setEntries([]);
      setTotalEntries(0);
      setTotalPages(0);
      setSelectedEntry(null);
      setCurrentPage(1);
    } catch {
      toast.error("Failed to clear");
    }
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <h2>History ({totalEntries})</h2>
        {entries.length > 0 && (
          <button className="clear-btn" onClick={handleClearAll}>Clear All</button>
        )}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : entries.length === 0 ? (
        <p>No history yet.</p>
      ) : (
        <HistoryList
          entries={entries}
          onView={setSelectedEntry}
          onDelete={handleDelete}
        />
      )}

      {selectedEntry && (
        <div className="history-detail-panel">
          <div className="detail-output-box">
            {selectedEntry.type === "translate" && (
              <div>
                <span className="detail-lang-badge">
                  Target: {selectedEntry.targetLanguage}
                </span>
                <pre className="detail-code-block">
                  {selectedEntry.output?.translatedCode}
                </pre>
              </div>
            )}
            {selectedEntry.type === "analyze" && (
              <div>
                <div className="detail-complexity-row">
                  <div className="detail-complexity-card">
                    <div className="detail-complexity-label">Time</div>
                    <div className="detail-complexity-value">
                      {selectedEntry.output?.timeComplexity}
                    </div>
                  </div>
                  <div className="detail-complexity-card">
                    <div className="detail-complexity-label">Space</div>
                    <div className="detail-complexity-value">
                      {selectedEntry.output?.spaceComplexity}
                    </div>
                  </div>
                </div>
                {selectedEntry.output?.explanation && (
                  <p className="detail-text">{selectedEntry.output.explanation}</p>
                )}
              </div>
            )}
            {selectedEntry.type === "optimize" && (
              <div>
                <pre className="detail-code-block">
                  {selectedEntry.output?.optimizedCode}
                </pre>
                {selectedEntry.output?.suggestions && (
                  <p className="detail-text">{selectedEntry.output.suggestions}</p>
                )}
              </div>
            )}
            {selectedEntry.type === "explain" && (
              <p className="detail-text">{selectedEntry.output?.explanation}</p>
            )}
          </div>
          <CodeEditor
            code={selectedEntry.inputCode || ""}
            language={selectedEntry.sourceLanguage}
            readOnly={true}
            onChange={() => {}}
            />
        </div>
      )}

      {totalPages > 1 && (
        <div className="history-pagination">
          <button
            className="page-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`page-btn ${currentPage === p ? "active" : ""}`}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="page-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;