export type Locale = "en" | "hi";

export interface LanguageOption {
  code: Locale;
  label: string;
  nativeName: string;
  shortLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeName: "English", shortLabel: "EN" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी", shortLabel: "हिं" },
];

export interface TranslationDictionary {
  common: {
    appName: string;
    controlRoom: string;
    realtimeConnected: string;
    reconnecting: string;
    signOut: string;
    loading: string;
    save: string;
    cancel: string;
    close: string;
    search: string;
    details: string;
    status: string;
    all: string;
    active: string;
    critical: string;
    resolved: string;
    filter: string;
    refresh: string;
    language: string;
    selectLanguage: string;
  };
  nav: {
    operations: string;
    resources: string;
    tools: string;
    overview: string;
    liveMap: string;
    incidents: string;
    assignments: string;
    teams: string;
    shelters: string;
    simulation: string;
  };
  dashboard: {
    tabs: {
      incidents: string;
      teams: string;
      shelters: string;
    };
    stats: {
      active: string;
      critical: string;
      teamsReady: string;
      deployed: string;
      shelterLoad: string;
    };
    mapLayers: {
      incidents: string;
      teams: string;
      shelters: string;
      heatmap: string;
      rainRadar: string;
    };
    weatherWarnings: string;
    weatherWarningsUntil: string;
    loadingMap: string;
    reallocatedToast: string;
    criticalIncidentArrived: string;
    assignedToast: string;
  };
  incidents: {
    title: string;
    searchPlaceholder: string;
    allFilter: string;
    activeFilter: string;
    criticalFilter: string;
    unassignedFilter: string;
    noIncidentsFound: string;
    reported: string;
    verified: string;
    unverified: string;
    corroborationReports: string;
    category: string;
    severity: string;
    priorityScore: string;
    location: string;
    casualties: string;
    trappedPersons: string;
    waterLevel: string;
    aiClassification: string;
    aiConfidence: string;
    corroborationNotes: string;
    recommendedActions: string;
    recommendedTeams: string;
    assignedTeam: string;
    assignTeam: string;
    resolveIncident: string;
    closeDrawer: string;
    categories: {
      FLOOD: string;
      FIRE: string;
      MEDICAL: string;
      TRAP: string;
      EVAC: string;
      RELIEF: string;
      OTHER: string;
    };
    severities: {
      LOW: string;
      MEDIUM: string;
      HIGH: string;
      CRITICAL: string;
    };
    statuses: {
      REPORTED: string;
      VERIFIED: string;
      ASSIGNED: string;
      IN_PROGRESS: string;
      RESOLVED: string;
      CANCELLED: string;
    };
  };
  resources: {
    title: string;
    ready: string;
    deployed: string;
    offline: string;
    changeStatus: string;
    members: string;
    equipment: string;
    vehicle: string;
    reallocationNotice: string;
    teamStatus: {
      AVAILABLE: string;
      DISPATCHED: string;
      ON_SCENE: string;
      OFFLINE: string;
      RESTING: string;
    };
  };
  shelters: {
    title: string;
    capacity: string;
    occupancy: string;
    availableSpots: string;
    open: string;
    full: string;
    closed: string;
    supplies: string;
    food: string;
    water: string;
    medical: string;
    contactPerson: string;
  };
  assignments: {
    title: string;
    noActive: string;
    noDone: string;
    showDone: string;
    hideDone: string;
    completed: string;
    lastUpdate: string;
    manualOverride: string;
    eta: string;
    actions: {
      Acknowledge: string;
      "En Route": string;
      "On Scene": string;
      Resolve: string;
    };
  };
  citizenReport: {
    title: string;
    whatIsHappening: string;
    pickClosest: string;
    tellUsMore: string;
    describePlaceholder: string;
    peopleNeedingHelp: string;
    addPhoto: string;
    optional: string;
    photoAttached: string;
    back: string;
    next: string;
    whereAreYou: string;
    gpsPrivacyNotice: string;
    detectLocation: string;
    tapGps: string;
    detectingLocation: string;
    locationDetected: string;
    landmarkPlaceholder: string;
    sendReport: string;
    sending: string;
    successTitle: string;
    successDesc: string;
    reportNumber: string;
    trackSigned: string;
    trackGuest: string;
    goToDashboard: string;
    createAccount: string;
    backHome: string;
    categories: {
      FLOOD: string;
      FIRE: string;
      LANDSLIDE: string;
      STRUCTURAL_COLLAPSE: string;
      MEDICAL_EMERGENCY: string;
      EARTHQUAKE: string;
      CYCLONE: string;
      OTHER: string;
    };
  };
  citizenPortal: {
    title: string;
    reconnecting: string;
    live: string;
    hiUser: string;
    activeWarnings: string;
    reportEmergency: string;
    reportEmergencySub: string;
    callHelpline: string;
    myReports: string;
    open: string;
    refresh: string;
    noReportsYet: string;
    noReportsDesc: string;
    makeFirstReport: string;
    reliefShelters: string;
    noShelterInfo: string;
    closed: string;
    almostFull: string;
    filling: string;
    openStatus: string;
    areaStatusTitle: string;
    incidentsWithin5km: string;
    noneReportedNearby: string;
    nearestReliefShelters: string;
    statusChips: {
      REPORTED: string;
      VALIDATED: string;
      UNASSIGNED: string;
      ASSIGNED: string;
      EN_ROUTE: string;
      ON_SCENE: string;
      RESOLVED: string;
      ESCALATED: string;
      CANCELLED: string;
    };
  };
  overview: {
    title: string;
    openMap: string;
    activeIncidents: string;
    critical: string;
    teamsAvailable: string;
    shelterUtilization: string;
    recentIncidents: string;
    noIncidents: string;
  };
  simulation: {
    title: string;
    subtitle: string;
    running: string;
    stopped: string;
    startSimulation: string;
    stopSimulation: string;
    resetDemo: string;
    resetting: string;
    timeline: string;
    scenarios: string;
    koelFloodScenario: string;
    speed: string;
    elapsed: string;
  };
  team: {
    title: string;
    reconnecting: string;
    rescueOperations: string;
    wrongRole: string;
    activeMissions: string;
    peopleWaiting: string;
    resolvedAllTeams: string;
    myTeams: string;
    claimYourTeam: string;
    claim: string;
    noTeamLinked: string;
    askOperator: string;
    activeMissionsLabel: string;
    onStandby: string;
    standbyDesc: string;
    newDispatch: string;
    eta: string;
    navigate: string;
    needBackup: string;
    loadingIncident: string;
    confirmReturned: string;
    goOffDuty: string;
    reportOnDuty: string;
    stepLabels: {
      PENDING: string;
      ACKNOWLEDGED: string;
      EN_ROUTE: string;
      ON_SCENE: string;
    };
    actionLabels: {
      Acknowledge: string;
      "En Route": string;
      "On Scene": string;
      Resolve: string;
    };
  };
  shelterManage: {
    title: string;
    reconnecting: string;
    reliefOperations: string;
    wrongRole: string;
    summary: {
      sheltersManaged: string;
      peopleSheltered: string;
      totalCapacityUsed: string;
    };
    claimYourShelter: string;
    claim: string;
    noSheltersAssigned: string;
    askOperator: string;
    occupancy: string;
    occupancyStatus: {
      open: string;
      filling: string;
      nearCapacity: string;
      full: string;
      closed: string;
    };
    controls: {
      minus5: string;
      plus1: string;
      plus5: string;
      plus10: string;
    };
    suppliesInventory: string;
    stockItems: {
      FOOD: string;
      WATER: string;
      MEDICAL: string;
      BLANKETS: string;
      CLOTHING: string;
      SANITATION: string;
      TENTS: string;
      OTHER: string;
    };
    ofCapacity: string;
    decrease: string;
    increase: string;
    loading: string;
  };
}
