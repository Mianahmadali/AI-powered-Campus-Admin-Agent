import React from 'react';
import StudentTable from '../components/StudentTable';
import styles from '../styles/Students.module.scss';

const Students = () => {
  return (
    <div className={styles.studentsPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Student Management</h1>
        <p className={styles.subtitle}>
          Manage student records, enrollments, and academic information
        </p>
      </div>
      
      <div className={styles.content}>
        <StudentTable />
      </div>
    </div>
  );
};

export default Students;
