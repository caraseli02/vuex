import Vue from "vue";
import Vuex from "vuex";
import { db } from "../main";
import { firebase } from "@firebase/app";
import "@firebase/auth";
import { vuexfireMutations, firestoreAction } from "vuexfire";
// import { v4 as uuidv4 } from "uuid";
//ALERTS
import VueSimpleAlert from "vue-simple-alert";

import auth from "./auth";
import notifi from "./notifi";
import theme from "./theme";

Vue.use(Vuex);
Vue.use(VueSimpleAlert);

// const path = `${process.env.VUE_APP_BACKEND_API}/attend`;

export const store = new Vuex.Store({
  state: {
    showSidebar: false,
    attendance: [],
    d: new Date(),
    users: [],
    selectedMonth: null,
    selectedTime: null,
    userData: null,
    workplaceList: [],
  },

  getters: {
    checkCalendarToday: state => {
      if (state.attendance[0]) {
        return (
          new Date(state.attendance[0].curentTime).toLocaleDateString() !==
            state.d.toLocaleDateString() &&
          new Date(state.attendance[0].curentTime).getMonth() ===
            state.d.getMonth()
        );
      }
      return state.d.getMonth();
    },
    filtredWorkers: state => {
      if (state.userData) {
        return state.users.filter(
          user =>
            state.userData.workplace.includes(user.workplace) &&
            !/@apimosa\.es$/.test(user.email) &&
            !/@test\.com$/.test(user.email) &&
            !/vladwebapp@gmail\.com$/.test(user.email)
        );
      }
    },
    filtredStaff: state => {
      return state.users.filter(
        user =>
          /@apimosa\.es$/.test(user.email) &&
          !/vladwebapp@gmail\.com$/.test(user.email)
      );
    },
  },

  mutations: {
    ...vuexfireMutations,
    TOGGLE_LOADING(state, payload) {
      state.loadingMap = !!payload;
    },
    SET_MONTH(state, payload) {
      state.selectedMonth = payload;
    },
    SET_MONTH_LIMITES(state, payload) {
      state.selectedTime = payload;
    },
    SET_USER_DATA(state, payload) {
      state.userData = payload;
    },
    TOGGLE_SIDEBAR(state) {
      state.showSidebar = !state.showSidebar;
    },
  },

  actions: {
    toggleSidebar(context) {
      context.commit("TOGGLE_SIDEBAR");
    },
    getWorkplacesList: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("workplaceList", db.collection("workplaceList"));
    }),
    bindAsist: firestoreAction(({ state, bindFirestoreRef }, time) => {
      // action to display attendance where leaveTime dosn´t exist
      // only for pass Month
      if (new Date(time.end).getMonth() < state.d.getMonth()) {
        return bindFirestoreRef(
          "attendance",
          db
            .collection("attendance")
            .where("delete_flag", "==", "N")
            .where("activeSession", "==", true)
            .where("author", "==", state.auth.user.uid)
            .where("curentTime", ">=", time.start)
            .where("curentTime", "<=", time.end - 1)
            .orderBy("curentTime", "desc")
            .limit(1)
        );
      }
      // action to get data of actual Month
      else {
        return bindFirestoreRef(
          "attendance",
          db
            .collection("attendance")
            .where("delete_flag", "==", "N")
            .where("author", "==", state.auth.user.uid)
            .where("curentTime", ">=", time.start)
            .where("curentTime", "<=", time.end - 1)
            .orderBy("curentTime", "desc")
            .limit(1)
        );
      }
    }),
    getAsist: firestoreAction(({ state, bindFirestoreRef }, data) => {
      // return the promise returned by `bindFirestoreRef`
      if (data.user === state.auth.user.email) {
        return bindFirestoreRef(
          "attendance",
          db
            .collection("attendance")
            .where("delete_flag", "==", "N")
            .where("author", "==", state.auth.user.uid)
            .where("curentTime", ">=", data.time.start)
            .where("curentTime", "<=", data.time.end - 1)
            .orderBy("curentTime", "desc")
        );
      } else {
        return bindFirestoreRef(
          "attendance",
          db
            .collection("attendance")
            .where("delete_flag", "==", "N")
            // .where("data.gpsData.City", "==", data.workplace)
            .where("data.gpsData.County", "==", data.workplace)
            // .where("data.email", "==", data.user)
            .where("curentTime", ">=", data.time.start)
            .where("curentTime", "<=", data.time.end)
            .orderBy("curentTime", "desc")
          // .limit(50)
        );
      }
    }),
    getUsers: firestoreAction(({ bindFirestoreRef }) => {
      // return the promise returned by `bindFirestoreRef`
      return bindFirestoreRef("users", db.collection("attendanceUsers"));
    }),
    async changeUserData(state, data) {
      const docRef = db.collection("attendanceUsers").doc(data.id);
      return await docRef.update({
        eatHour: data.eatHour === "True" ? true : false,
        schedule: data.schedule,
        workplace: data.workplace,
      });
    },
    async addWorkPlace(state, data) {
      db.collection("workplaceList")
        .doc(data)
        .set({
          value: data,
        })
        .then(() => {
          console.log("Document successfully written!");
        })
        .catch(error => {
          console.error("Error writing document: ", error);
        });
    },
    async deleteWorkPlace(state, data) {
      db.collection("workplaceList")
        .doc(data)
        .delete()
        .then(() => {
          console.log("Document successfully deleted!");
        })
        .catch(error => {
          console.error("Error deleting document: ", error);
        });
    },
    async changeUserWorkPlace(state, data) {
      const docRef = db.collection("attendanceUsers").doc(data.id);
      return await docRef.update({
        workplace: data.workplace,
      });
    },
    async makeStaff({ state, commit }) {
      const docRef = db.collection("attendanceUsers").doc(state.auth.user.uid);
      return await docRef
        .update({
          isStaff: true,
        })
        .then(() => {
          const userData = state.users.find(
            ({ author }) => author === state.auth.user.uid
          );
          commit("SET_USER_DATA", userData);
        });
    },
    deleteAsist: firestoreAction((context, asistId) => {
      db.collection("attendance")
        .doc(asistId)
        .delete();
    }),
    async changeAttendanceAdmin(state, userData) {
      const docRef = db.collection("attendance").doc(userData.id);
      return await docRef.update({
        data: userData.data,
        activeSession: userData.activeSession,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        closedAt: userData.data.leaveTime
          ? firebase.firestore.FieldValue.serverTimestamp()
          : "",
      });
    },
    async generateAttendance(state, data) {
      await db
        .collection("attendance")
        .doc(data.id)
        .set(data)
        .then(() => {
          console.log("Document successfully written!");
        });
    },
    selectMonth(context, userData) {
      context.commit("SET_MONTH", userData);
    },
    selectMonthLimites(context, userData) {
      context.commit("SET_MONTH_LIMITES", userData);
    },
    setUserData(context, userData) {
      context.commit("SET_USER_DATA", userData);
    },
  },

  modules: {
    auth,
    notifi,
    theme,
  },
});
