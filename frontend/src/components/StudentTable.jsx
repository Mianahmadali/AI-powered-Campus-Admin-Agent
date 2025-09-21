import React, { useState, useMemo } from 'react';
import {
  RiSearchLine,
  RiFilterLine,
  RiSortAsc,
  RiSortDesc,
  RiEditLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiDownloadLine,
  RiAddLine,
  RiMoreLine,
  RiRefreshLine,
  RiCloseLine,
  RiCheckLine,
  RiUserLine,
  RiMailLine,
  RiBuildingLine,
  RiCalendarLine,
  RiShieldLine
} from 'react-icons/ri';
import styles from './StudentTable.module.scss';

const StudentTable = ({
  data = [],
  loading = false,
  onEdit,
  onDelete,
  onView,
  onAdd,
  onRefresh,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterConfig, setFilterConfig] = useState({
    department: 'all',
    status: 'all',
    year: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Get unique values for filter options
  const departments = useMemo(() => {
    const depts = [...new Set(data.map(student => student.department).filter(Boolean))];
    return depts.sort();
  }, [data]);

  const years = useMemo(() => {
    const yearSet = [...new Set(data.map(student => student.year).filter(Boolean))];
    return yearSet.sort();
  }, [data]);

  const statuses = useMemo(() => {
    const statusSet = [...new Set(data.map(student => student.status).filter(Boolean))];
    return statusSet.sort();
  }, [data]);

  // Filter and search functionality
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(search) ||
        student.email?.toLowerCase().includes(search) ||
        student.student_id?.toLowerCase().includes(search) ||
        student.department?.toLowerCase().includes(search)
      );
    }

    // Apply filters
    if (filterConfig.department !== 'all') {
      filtered = filtered.filter(student => student.department === filterConfig.department);
    }
    if (filterConfig.status !== 'all') {
      filtered = filtered.filter(student => student.status === filterConfig.status);
    }
    if (filterConfig.year !== 'all') {
      filtered = filtered.filter(student => student.year === parseInt(filterConfig.year));
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, filterConfig, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(student => student.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id, checked) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const handleFilterChange = (filterType, value) => {
    setFilterConfig(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilterConfig({ department: 'all', status: 'all', year: 'all' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleExport = () => {
    const csvData = filteredData.map(student => ({
      'Student ID': student.student_id,
      'Name': student.name,
      'Email': student.email,
      'Department': student.department,
      'Year': student.year,
      'Status': student.status
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'suspended': return 'warning';
      case 'graduated': return 'info';
      default: return 'neutral';
    }
  };

  if (loading) {
    return (
      <div className={`${styles.studentTable} ${className}`}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <h3>Loading Students...</h3>
          <p>Fetching student data from the database</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.studentTable} ${className}`}>
      {/* Table Header */}
      <div className={styles.tableHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.searchContainer}>
            <RiSearchLine className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={styles.clearSearch}
              >
                <RiCloseLine />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
          >
            <RiFilterLine /> Filters
          </button>

          {(searchTerm || Object.values(filterConfig).some(v => v !== 'all')) && (
            <button onClick={clearFilters} className={styles.clearButton}>
              Clear All
            </button>
          )}
        </div>

        <div className={styles.headerRight}>
          <div className={styles.resultsCount}>
            {filteredData.length} of {data.length} students
          </div>

          <button onClick={handleExport} className={styles.actionButton}>
            <RiDownloadLine /> Export
          </button>

          <button onClick={onRefresh} className={styles.actionButton}>
            <RiRefreshLine /> Refresh
          </button>

          <button onClick={onAdd} className={styles.addButton}>
            <RiAddLine /> Add Student
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label>Department</label>
            <select
              value={filterConfig.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Status</label>
            <select
              value={filterConfig.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Year</label>
            <select
              value={filterConfig.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>Year {year}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterActions}>
            <button onClick={clearFilters}>Clear Filters</button>
          </div>
        </div>
      )}

      {/* Selected Actions */}
      {selectedRows.size > 0 && (
        <div className={styles.selectedActions}>
          <span>{selectedRows.size} selected</span>
          <button onClick={() => console.log('Bulk edit')}>
            <RiEditLine /> Edit Selected
          </button>
          <button onClick={() => console.log('Bulk delete')}>
            <RiDeleteBinLine /> Delete Selected
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className={styles.tableContainer}>
        {filteredData.length === 0 ? (
          <div className={styles.emptyState}>
            <RiUserLine className={styles.emptyIcon} />
            <h3>No students found</h3>
            <p>
              {data.length === 0
                ? "No students have been added yet."
                : "Try adjusting your search or filter criteria."}
            </p>
            {data.length === 0 && (
              <button onClick={onAdd} className={styles.addFirstButton}>
                <RiAddLine /> Add First Student
              </button>
            )}
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  {[
                    { key: 'name', label: 'Name', icon: RiUserLine },
                    { key: 'student_id', label: 'Student ID', icon: RiShieldLine },
                    { key: 'email', label: 'Email', icon: RiMailLine },
                    { key: 'department', label: 'Department', icon: RiBuildingLine },
                    { key: 'year', label: 'Year', icon: RiCalendarLine },
                    { key: 'status', label: 'Status', icon: RiCheckLine }
                  ].map(({ key, label, icon: Icon }) => (
                    <th key={key} onClick={() => handleSort(key)} className={styles.sortableHeader}>
                      <div className={styles.headerContent}>
                        <Icon className={styles.headerIcon} />
                        <span>{label}</span>
                        {sortConfig.key === key && (
                          sortConfig.direction === 'asc' ? <RiSortAsc /> : <RiSortDesc />
                        )}
                      </div>
                    </th>
                  ))}
                  <th className={styles.actionsCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((student) => (
                  <tr key={student.id} className={styles.tableRow}>
                    <td className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(student.id)}
                        onChange={(e) => handleSelectRow(student.id, e.target.checked)}
                      />
                    </td>
                    <td className={styles.nameCell}>
                      <div className={styles.studentInfo}>
                        <div className={styles.avatar}>
                          {student.avatar ? (
                            <img src={student.avatar} alt={student.name} />
                          ) : (
                            <RiUserLine />
                          )}
                        </div>
                        <div className={styles.nameDetails}>
                          <div className={styles.studentName}>{student.name}</div>
                          <div className={styles.studentId}>{student.student_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{student.student_id}</td>
                    <td className={styles.emailCell}>{student.email}</td>
                    <td className={styles.departmentCell}>{student.department}</td>
                    <td className={styles.yearCell}>Year {student.year}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[getStatusColor(student.status)]}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => onView && onView(student)}
                          className={styles.actionBtn}
                          title="View details"
                        >
                          <RiEyeLine />
                        </button>
                        <button
                          onClick={() => onEdit && onEdit(student)}
                          className={styles.actionBtn}
                          title="Edit student"
                        >
                          <RiEditLine />
                        </button>
                        <button
                          onClick={() => onDelete && onDelete(student)}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          title="Delete student"
                        >
                          <RiDeleteBinLine />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <div className={styles.paginationInfo}>
                  Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} students
                </div>
                
                <div className={styles.paginationControls}>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className={styles.rowsPerPageSelect}
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                  
                  <div className={styles.pageButtons}>
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    
                    <span className={styles.pageNumbers}>
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentTable;