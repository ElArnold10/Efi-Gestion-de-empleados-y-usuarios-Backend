// Sistema de almacenamiento en memoria para el backend
class MemoryStorage {
  constructor() {
    this.users = [];
    this.employees = [];
    this.schedules = [];
    this.scheduleRequests = [];
    this.employeeRequests = [];
    this.notifications = [];
    this.nextId = 1;
    
    // Inicializar datos por defecto
    this.initializeDefaultData();
  }

  initializeDefaultData() {
    // Crear administrador por defecto
    const adminUser = {
      id: this.nextId++,
      email: 'admin@horarios.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
      name: 'Administrador',
      role: 'admin',
      created_at: new Date().toISOString()
    };
    this.users.push(adminUser);
  }

  // Métodos para usuarios
  createUser(userData) {
    const user = {
      id: this.nextId++,
      ...userData,
      created_at: new Date().toISOString()
    };
    this.users.push(user);
    return user;
  }

  findUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  findUserById(id) {
    return this.users.find(user => user.id === id);
  }

  updateUser(id, userData) {
    const index = this.users.findIndex(user => user.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...userData };
      return this.users[index];
    }
    return null;
  }

  // Métodos para empleados
  createEmployee(employeeData) {
    const employee = {
      id: this.nextId++,
      ...employeeData,
      created_at: new Date().toISOString()
    };
    this.employees.push(employee);
    return employee;
  }

  getEmployees() {
    return this.employees.filter(emp => emp.status !== 'deleted');
  }

  getEmployeeById(id) {
    return this.employees.find(emp => emp.id === id && emp.status !== 'deleted');
  }

  updateEmployee(id, employeeData) {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
      this.employees[index] = { ...this.employees[index], ...employeeData };
      return this.employees[index];
    }
    return null;
  }

  deleteEmployee(id) {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
      this.employees[index].status = 'deleted';
      return this.employees[index];
    }
    return null;
  }

  // Métodos para solicitudes de empleado
  createEmployeeRequest(requestData) {
    const request = {
      id: this.nextId++,
      ...requestData,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    this.employeeRequests.push(request);
    return request;
  }

  getEmployeeRequests() {
    return this.employeeRequests.filter(req => req.status === 'pending');
  }

  getEmployeeRequestById(id) {
    return this.employeeRequests.find(req => req.id === id);
  }

  updateEmployeeRequest(id, requestData) {
    const index = this.employeeRequests.findIndex(req => req.id === id);
    if (index !== -1) {
      this.employeeRequests[index] = { ...this.employeeRequests[index], ...requestData };
      return this.employeeRequests[index];
    }
    return null;
  }

  // Métodos para horarios
  createSchedule(scheduleData) {
    const schedule = {
      id: this.nextId++,
      ...scheduleData,
      created_at: new Date().toISOString()
    };
    this.schedules.push(schedule);
    return schedule;
  }

  getSchedules() {
    return this.schedules;
  }

  getScheduleById(id) {
    return this.schedules.find(schedule => schedule.id === id);
  }

  updateSchedule(id, scheduleData) {
    const index = this.schedules.findIndex(schedule => schedule.id === id);
    if (index !== -1) {
      this.schedules[index] = { ...this.schedules[index], ...scheduleData };
      return this.schedules[index];
    }
    return null;
  }

  deleteSchedule(id) {
    const index = this.schedules.findIndex(schedule => schedule.id === id);
    if (index !== -1) {
      this.schedules.splice(index, 1);
      return true;
    }
    return false;
  }

  // Métodos para solicitudes de cambio de horario
  createScheduleRequest(requestData) {
    const request = {
      id: this.nextId++,
      ...requestData,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    this.scheduleRequests.push(request);
    return request;
  }

  getScheduleRequests() {
    return this.scheduleRequests;
  }

  getMyScheduleRequests(userId) {
    return this.scheduleRequests.filter(req => req.user_id === userId);
  }

  updateScheduleRequest(id, requestData) {
    const index = this.scheduleRequests.findIndex(req => req.id === id);
    if (index !== -1) {
      this.scheduleRequests[index] = { ...this.scheduleRequests[index], ...requestData };
      return this.scheduleRequests[index];
    }
    return null;
  }

  // Métodos para notificaciones
  createNotification(notificationData) {
    const notification = {
      id: this.nextId++,
      ...notificationData,
      read: false,
      created_at: new Date().toISOString()
    };
    this.notifications.push(notification);
    return notification;
  }

  getNotifications(userId) {
    return this.notifications.filter(notif => notif.user_id === userId);
  }

  markNotificationAsRead(id) {
    const notification = this.notifications.find(notif => notif.id === id);
    if (notification) {
      notification.read = true;
      return notification;
    }
    return null;
  }

  markAllNotificationsAsRead(userId) {
    const userNotifications = this.notifications.filter(notif => notif.user_id === userId);
    userNotifications.forEach(notif => {
      notif.read = true;
    });
    return userNotifications.length;
  }

  deleteNotification(id) {
    const index = this.notifications.findIndex(notif => notif.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      return true;
    }
    return false;
  }

  getUnreadNotificationsCount(userId) {
    return this.notifications.filter(notif => notif.user_id === userId && !notif.read).length;
  }
}

module.exports = MemoryStorage;
