"use client";

import { ExperimentSync, Group } from "@/api/experiment";
import { Subject } from "@/api/subject";
import { User } from "@/api/user";
import { create, StateCreator, useStore } from "zustand";
import { persist } from "zustand/middleware";

export interface DefaultExperimentState {
  // id: number | null;
  // title: string | null;
  // description: string | null;
  // video: string | null;
  questions: string[];
}

export interface ExperimentState {
  lab: number | null;
  subject: Subject | null;
  teachers: User[];
  students: User[];
  groups: Group[];
  status: string;
  questions: string[];
  answers: string[];
  simulation: { [p: string]: any };
  collections: any[];
  conclusion: string;
  // id: number | null;
  // title: string | null;
  // description: string | null;
  // video: string | null;
  oplog: string;
  process: "synchronized" | "disconnected" | "connecting" | "connected";
  hasGroup: boolean;

  lobby: boolean;
  started: boolean;
  ended: boolean;
  step: number;
  stepping: boolean;
  openSideNav: boolean;

  join(user: User): void;
  leave(user: User): void;
  reset(): void;
  sync(value: ExperimentSync): void;

  addGroup(): void;
  delGroup(index: number): void;
  joinGroup(index: number, student: User): void;
  leaveGroup(index: number, student: User): void;
  setSubject(value: Subject): void;
  addQuestion(value: string): void;
  delQuestion(value: string): void;
  setAnswers(value: string[]): void;
  setSimulation(value: { [p: string]: any }): void;
  setCollections(value: string[][]): void;
  setConclusion(value: string): void;

  setSubjectUSync(value: Subject): void; // non oplog
  setStatusUSync(value: string): void; // non oplog

  setProcess(
    value: "synchronized" | "disconnected" | "connecting" | "connected",
  ): void;
  setLab(value: number | null): void;

  toggleLobby(): void;
  wait(): void;
  start(): void;
  end(): void;
  setStep(value: number, publish?: boolean): void;
  setOpenSideNav(value: boolean): void;
}

// let index = 0;
let count = 0;

export const experimentSlice: StateCreator<
  ExperimentState,
  any,
  any,
  ExperimentState
> = persist(
  (set, get, store) => ({
    lab: null,
    subject: null,
    teachers: [],
    students: [],
    groups: [],
    status: "waiting",
    questions: [],
    answers: [],
    simulation: Object.create(null),
    collections: [],
    conclusion: "",
    // id: null,
    // title: null,
    // description: null,
    // video: null,
    // questions: [],
    process: "connecting",
    oplog: "",
    hasGroup: false,
    lobby: true,
    started: false,
    ended: false,
    step: 0,
    stepping: false,
    openSideNav: false,
    reset() {
      count = 0;
      set(store.getInitialState());
      // set({
      //   lab: null,
      //   teachers: [],
      //   students: [],
      //   groups: [],
      //   subject: null,
      //   status: "waiting",
      //   questions: [],
      //   oplog: "",
      //   // step: 0,
      // });
    },
    join(user: User) {
      if (user.role == "teacher") {
        set({ teachers: [...get().teachers, user] });
      } else if (user.role == "student") {
        set({ students: [...get().students, user] });
      }
    },
    leave(user: User) {
      if (user.role == "teacher") {
        set({
          teachers: get().teachers.filter((item) => item.id != user.id),
        });
      } else if (user.role == "student") {
        set({
          students: get().students.filter((item) => item.id != user.id),
        });
      }
    },
    sync(value) {
      let change: Partial<ExperimentState> = { process: "synchronized" };
      if (value.attr == "all" || value.attr == "users") {
        change.teachers = value.teachers ?? [];
        change.students = value.students ?? [];
      }
      if (value.attr == "all" || value.attr == "groups") {
        change.groups = value.groups ?? [];
      }
      if (value.attr == "all" || value.attr == "subject") {
        change.subject = value.subject;
      }
      if (value.attr == "all" || value.attr == "status") {
        change.status = value.status;
        if (value.status == "started" && get().process == "synchronized") {
          change.step = 1;
          change.stepping = true;
        }
      }
      if (value.attr == "all" || value.attr == "questions") {
        change.questions = value.questions ?? [];
      }
      if (value.attr == "all" || value.attr == "answers") {
        change.answers = value.answers ?? []
      }
      if (value.attr == "all" || value.attr == "simulation") {
        change.simulation = value.simulation;
      }
      if (value.attr == "all" || value.attr == "collections") {
        change.collections = value.collections;
      }
      if (value.attr == "all" || value.attr == "conclusion") {
        change.conclusion = value.conclusion;
      }
      set(change);
    },
    addGroup() {
      set({
        oplog: "groups-" + (count += 1),
        groups: [
          ...get().groups,
          {
            id: Date.now(),
            name: "Group " + (get().groups.length + 1),
            students: [],
          },
        ],
      });
    },
    delGroup(index) {
      set({
        oplog: "groups-" + (count += 1),
        groups: get().groups.filter((item) => item.id != index),
      });
    },
    joinGroup(index, user) {
      if (user.role != "student") {
        return;
      }
      set({
        oplog: "groups-" + (count += 1),
        groups: get().groups.map((item) => {
          if (item.id != index) {
            return item;
          }
          if (!item.students.some((student) => student.id == user.id)) {
            item.students.push(user);
          }
          return item;
        }),
        hasGroup: true,
      });
    },
    leaveGroup(index, user) {
      set({
        oplog: "groups-" + (count += 1),
        groups: get().groups.map((item) => {
          if (item.id != index) {
            return item;
          }
          item.students = item.students.filter((item) => item.id != user.id);
          return item;
        }),
        hasGroup: false,
      });
    },
    setSubject(subject) {
      set({
        oplog: "subject-" + (count += 1),
        subject,
      });
    },
    addQuestion(value) {
      set({
        oplog: "questions-" + (count += 1),
        questions: [...get().questions, value],
      });
    },
    delQuestion(value) {
      set({
        oplog: "questions-" + (count += 1),
        questions: get().questions.filter((item) => item != value),
      });
    },
    setAnswers(value) {
      set({
        oplog: "answers-" + (count += 1),
        answers: value,
      });
    },
    setSimulation(value) {
      set({
        oplog: "simulation-" + (count += 1),
        simulation: value,
      });
    },
    setCollections(value) {
      set({
        oplog: "collections-" + (count += 1),
        collections: value,
      });
    },
    setConclusion(value) {
      set({
        oplog: "conclusion-" + (count += 1),
        conclusion: value,
      });
    },

    setSubjectUSync(value) {
      set({
        subject: value,
      });
    },
    setStatusUSync(value) {
      set({
        status: value,
      });
    },
    setLab(value) {
      set({ lab: value });
    },

    setProcess(value) {
      set({ process: value });
    },

    toggleLobby() {
      set({ lobby: !get().lobby });
    },
    wait() {
      set({
        // oplog: "status-" + (count += 1),
        status: "waiting",
        lobby: true,
        started: false,
        ended: false,
        step: 0,
        stepping: true,
      });
    },
    start() {
      set({
        oplog: "status-" + (count += 1),
        status: "started",
        lobby: false,
        started: true,
        ended: false,
        step: 1,
        stepping: true,
      });
    },
    end() {
      set({ lobby: true, started: false, ended: true, step: 0 });
    },
    setStep(value, publish = true) {
      set({ step: value, stepping: publish });
    },
    setOpenSideNav(value) {
      set({ openSideNav: value });
    },
  }),
  {
    name: "experiment-storage",
    version: 1,
    partialize: (state) => ({
      // lab: state.lab,
      lab: null,
      teachers: [],
      students: [],
      groups: [],
      subject: null,
      status: null,
      questions: [],
      simulation: Object.create(null),
      answers: [],
      collections: [],
      conclusion: "",

      process: "connecting",
      step: state.step,
      stepping: false,
    }),
  },
);

export const useExperimentStore = create<ExperimentState>()(experimentSlice);

export const defaultExperimentState: DefaultExperimentState = {
  questions: [],
};

export const useExperimentState = (
  initState: DefaultExperimentState = defaultExperimentState,
) => {
  const store = create<ExperimentState>()((...a) => ({
    ...initState,
    ...experimentSlice(...a),
  }));
  return useStore(store);
};
