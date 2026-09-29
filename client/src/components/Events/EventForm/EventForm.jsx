import { useEffect, useState } from 'react';
import {
  localDateTimeToIso,
  toLocalDateTimeInput,
  toLocalDateTimeInputForDay,
} from '../../../utils/dateUtils.js';
import './EventForm.css';

function EventForm({ event, selectedDate, isSubmitting, onSubmit, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [formError, setFormError] = useState('');
  const [invalidField, setInvalidField] = useState('');

  useEffect(() => {
    setTitle(event?.title || '');
    setDescription(event?.description || '');
    setStartAt(event?.startAt
      ? toLocalDateTimeInput(event.startAt)
      : toLocalDateTimeInputForDay(selectedDate));
    setFormError('');
    setInvalidField('');
  }, [event, selectedDate]);

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    setFormError('');
    setInvalidField('');

    const isoStartAt = localDateTimeToIso(startAt);
    if (!title.trim()) {
      setFormError('Enter a title for this event.');
      setInvalidField('title');
      return;
    }
    if (!isoStartAt) {
      setFormError('Choose a valid date and time.');
      setInvalidField('startAt');
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        startAt: isoStartAt,
      });
    } catch {
      // The page displays the API error while keeping the form values intact.
    }
  }

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <p className="eyebrow">{event ? 'Make a change' : 'Start here'}</p>
      <h2>{event ? 'Edit event' : 'Add an event'}</h2>

      <div className="form-field">
        <label htmlFor="event-title">Title</label>
        <input
          id="event-title"
          name="title"
          type="text"
          value={title}
          onChange={(changeEvent) => {
            setTitle(changeEvent.target.value);
            if (invalidField === 'title') {
              setFormError('');
              setInvalidField('');
            }
          }}
          maxLength={120}
          placeholder="What do you have planned?"
          aria-invalid={invalidField === 'title'}
          aria-describedby={invalidField === 'title' ? 'event-form-error' : undefined}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="event-start-at">Date and time</label>
        <input
          id="event-start-at"
          name="startAt"
          type="datetime-local"
          value={startAt}
          onChange={(changeEvent) => {
            setStartAt(changeEvent.target.value);
            if (invalidField === 'startAt') {
              setFormError('');
              setInvalidField('');
            }
          }}
          aria-invalid={invalidField === 'startAt'}
          aria-describedby={invalidField === 'startAt' ? 'event-form-error' : undefined}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="event-description">Description <span>(optional)</span></label>
        <textarea
          id="event-description"
          name="description"
          value={description}
          onChange={(changeEvent) => setDescription(changeEvent.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Add a few details"
        />
      </div>

      {formError && <p id="event-form-error" className="form-error" role="alert">{formError}</p>}

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : event ? 'Save changes' : 'Add event'}
        </button>
        {event && (
          <button
            className="secondary-button"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default EventForm;