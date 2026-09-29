import { useEffect, useState } from 'react';
import { localDateTimeToIso, toLocalDateTimeInput } from '../../utils/dateUtils.js';

function EventForm({ event, isSubmitting, onSubmit, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setTitle(event?.title || '');
    setDescription(event?.description || '');
    setStartAt(toLocalDateTimeInput(event?.startAt));
    setFormError('');
  }, [event]);

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    setFormError('');

    const isoStartAt = localDateTimeToIso(startAt);
    if (!title.trim()) {
      setFormError('Enter a title for this event.');
      return;
    }
    if (!isoStartAt) {
      setFormError('Choose a valid date and time.');
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
          onChange={(changeEvent) => setTitle(changeEvent.target.value)}
          maxLength={120}
          placeholder="What do you have planned?"
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
          onChange={(changeEvent) => setStartAt(changeEvent.target.value)}
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

      {formError && <p className="form-error" role="alert">{formError}</p>}

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