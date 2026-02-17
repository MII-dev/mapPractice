import React from "react";

interface TimeSliderProps {
    dates: string[];
    selectedDate: string | null;
    onChange: (date: string | null) => void;
}

const TimeSlider: React.FC<TimeSliderProps> = ({ dates, selectedDate, onChange }) => {
    if (!dates || dates.length <= 1) return null;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("uk-UA", { month: "short", year: "2-digit" });
    };

    return (
        <div className="time-slider-container">
            <div className="time-slider-content">
                <button
                    className={`time-option ${selectedDate === null ? "active" : ""}`}
                    onClick={() => onChange(null)}
                >
                    Актуально
                </button>
                <div className="vertical-divider" />
                <div className="dates-scroll">
                    {dates.map((date) => (
                        <button
                            key={date}
                            className={`time-option ${selectedDate === date ? "active" : ""}`}
                            onClick={() => onChange(date)}
                        >
                            {formatDate(date)}
                        </button>
                    ))}
                </div>
            </div>

            <style>{`
        .time-slider-container {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          display: flex;
          justify-content: center;
          width: auto;
          max-width: 90vw;
        }

        .time-slider-content {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 20px;
          padding: 6px;
          display: flex;
          align-items: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .vertical-divider {
          width: 1px;
          height: 24px;
          background: rgba(0, 0, 0, 0.1);
          margin: 0 8px;
        }

        .dates-scroll {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          padding-right: 8px;
          scrollbar-width: none; /* Firefox */
        }

        .dates-scroll::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }

        .time-option {
          padding: 8px 16px;
          border-radius: 14px;
          border: none;
          background: transparent;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .time-option:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #1e293b;
        }

        .time-option.active {
          background: #0f172a;
          color: white;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
        }

        @media (max-width: 768px) {
          .time-slider-container {
            bottom: 16px;
          }
          .time-option {
            padding: 6px 12px;
            font-size: 11px;
          }
        }
      `}</style>
        </div>
    );
};

export default TimeSlider;
