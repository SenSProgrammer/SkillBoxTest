const PREFIX = "???";

const req = (url, options = {}) => {
  const { body } = options;

  return fetch((PREFIX + url).replace(/\/\/$/, ""), {
    ...options,
    body: body ? JSON.stringify(body) : null,
    headers: {
      ...options.headers,
      ...(body
        ? {
            "Content-Type": "application/json",
          }
        : null),
    },
  }).then((res) =>
    res.ok
      ? res.json()
      : res.text().then((message) => {
          throw new Error(message);
        })
  );
};

// на втором шаге проверим этот вариант
// на текущем шаге используем проверенный ранее вариант fetch

const notification = (config) =>
    UIkit.notification({
      pos: "top-right",
      timeout: 5000,
      ...config,
    });

  const alert = (message) =>
    notification({
      message,
      status: "danger",
    });

  const info = (message) =>
    notification({
      message,
      status: "success",
    });

  const fetchJson = (...args) =>
    fetch(...args)
      .then((res) =>
        res.ok
          ? res.status !== 204
            ? res.json()
            : null
          : res.text().then((text) => {
              throw new Error(text);
            })
      )
      .catch((err) => {
        alert(err.message);
      });

      const fetchActiveNotes() {
        fetchJson("/api/notes?isActive=true").then((activeNotes) => {
          return activeNotes;
        });
      }
      const fetchNotActiveNotes() {
        fetchJson("/api/notes?isActive=false").then((oldNotes) => {
          return oldNotes;
        });
      }

      stopTimer(id) {
        fetchJson(`/api/notes/${id}/stop`, {
          method: "post",
        }).then(() => {
          info(`Stopped the timer [${id}]`);

        });
      }
// конец блока из уроков таймерз

export const getNotes = ({ age, search, page } = {}) => {};

export const createNote = (description, content) => {

  fetchJson("/api/notes", {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ description, content }),
        }).then(({ id }) => {
          info(`Created new note "${description}" [${id}]`);
          //this.fetchActiveNotes();
        });

};

export const getNote = (id) => { return "test";};

export const archiveNote = {};

export const unarchiveNote = {};

export const editNote = (id, title, text) => {};

export const deleteNote = (id) => {};

export const deleteAllArchived = () => {};

export const notePdfUrl = (id) => {};

