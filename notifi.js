const state = {
  notificationMessage: null,
  notificationType: null,
};
const getters = {
  notificationMessage: state => state.notificationMessage,
  notificationType: state => state.notificationType,
};
const mutations = {
  SET_NOTIFICATION(state, { notificationMessage, notificationType }) {
    state.notificationMessage = notificationMessage;
    state.notificationType = notificationType;
  },
};
const actions = {
  async showNotification({ commit }, payload) {
    commit("SET_NOTIFICATION", payload);

    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        commit("SET_NOTIFICATION", {
          notificationMessage: "",
          notificationType: "",
        });
        resolve();
      }, 3000);
    });
  },
  clearNotification({ commit }) {
    commit("SET_NOTIFICATION", {
      notificationMessage: "",
      notificationType: "",
    });
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
