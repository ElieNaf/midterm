import React from 'react';
import './datagrid.css';

function DataGrid({ users }) {
    return (
        <div className="data-grid">
            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Score</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.username}</td>
                            <td>{user.score}</td>
                            <td>{user.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default DataGrid;
