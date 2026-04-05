import { FaXTwitter, FaFacebook, FaInstagram } from "react-icons/fa6";
import { FiPlus, FiX } from "react-icons/fi";
import type { PostingSchedule as PostingScheduleType, Platform, PlatformSchedule, TimeSlot } from "../../types/agent";

interface Props {
  schedule: PostingScheduleType;
  onChange: (schedule: PostingScheduleType) => void;
}

const PLATFORM_META: Record<Platform, { name: string; icon: React.ReactNode }> = {
  twitter: { name: "X (Twitter)", icon: <FaXTwitter /> },
  facebook: { name: "Facebook", icon: <FaFacebook /> },
  instagram: { name: "Instagram", icon: <FaInstagram /> },
};

function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function PlatformScheduleEditor({
  platform,
  schedule,
  onChange,
}: {
  platform: Platform;
  schedule: PlatformSchedule;
  onChange: (schedule: PlatformSchedule) => void;
}) {
  const meta = PLATFORM_META[platform];

  const addTimeSlot = () => {
    const newSlot: TimeSlot = { hour: 12, minute: 0, enabled: true };
    onChange({ ...schedule, timeSlots: [...schedule.timeSlots, newSlot] });
  };

  const removeTimeSlot = (index: number) => {
    onChange({
      ...schedule,
      timeSlots: schedule.timeSlots.filter((_, i) => i !== index),
    });
  };

  const updateTimeSlot = (index: number, updates: Partial<TimeSlot>) => {
    const slots = [...schedule.timeSlots];
    slots[index] = { ...slots[index], ...updates };
    onChange({ ...schedule, timeSlots: slots });
  };

  const updateMix = (type: string, value: number) => {
    onChange({
      ...schedule,
      contentMix: { ...schedule.contentMix, [type]: value },
    });
  };

  return (
    <div className={`schedule-platform-card ${schedule.enabled ? "enabled" : ""}`}>
      <div className="schedule-platform-header">
        <div className="schedule-platform-label">
          <span className="schedule-platform-icon">{meta.icon}</span>
          <span>{meta.name}</span>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={schedule.enabled}
            onChange={(e) => onChange({ ...schedule, enabled: e.target.checked })}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {schedule.enabled && (
        <div className="schedule-platform-body">
          <div className="form-group">
            <label className="form-label">Posts per day</label>
            <div className="range-input">
              <input
                type="range"
                min={1}
                max={12}
                value={schedule.postsPerDay}
                onChange={(e) =>
                  onChange({ ...schedule, postsPerDay: parseInt(e.target.value) })
                }
              />
              <span className="range-value">{schedule.postsPerDay}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Time Slots
              <button className="btn-icon-sm" onClick={addTimeSlot} type="button">
                <FiPlus />
              </button>
            </label>
            <div className="time-slots">
              {schedule.timeSlots.map((slot, i) => (
                <div key={i} className="time-slot">
                  <input
                    type="time"
                    value={formatTime(slot.hour, slot.minute)}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(":").map(Number);
                      updateTimeSlot(i, { hour: h, minute: m });
                    }}
                    className="form-input time-input"
                  />
                  <label className="toggle-switch small">
                    <input
                      type="checkbox"
                      checked={slot.enabled}
                      onChange={(e) => updateTimeSlot(i, { enabled: e.target.checked })}
                    />
                    <span className="toggle-slider" />
                  </label>
                  <button className="btn-icon-sm danger" onClick={() => removeTimeSlot(i)} type="button">
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Content Mix (%)</label>
            <div className="content-mix-grid">
              {(["original", "reply", "quote", "thread"] as const).map((type) => (
                <div key={type} className="mix-item">
                  <label>{type.charAt(0).toUpperCase() + type.slice(1)}</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={schedule.contentMix[type]}
                    onChange={(e) => updateMix(type, parseInt(e.target.value) || 0)}
                    className="form-input mix-input"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PostingSchedule({ schedule, onChange }: Props) {
  return (
    <div className="wizard-form">
      <div className="form-section">
        <p className="form-section-desc">
          Configure when and how often your agent posts on each platform.
          Set time slots in your local timezone.
        </p>

        <div className="form-group">
          <label className="form-label">Timezone</label>
          <select
            className="form-select"
            value={schedule.timezone}
            onChange={(e) => onChange({ ...schedule, timezone: e.target.value })}
          >
            {Intl.supportedValuesOf("timeZone").map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <div className="schedule-platforms">
          {(["twitter", "facebook", "instagram"] as Platform[]).map((platform) => (
            <PlatformScheduleEditor
              key={platform}
              platform={platform}
              schedule={schedule[platform]}
              onChange={(updated) => onChange({ ...schedule, [platform]: updated })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
