import React from 'react';

interface Relationship {
  source: string;
  target: string;
  type: string;
}

interface RelationshipsTableProps {
  relationships: Relationship[];
}

const RelationshipsTable: React.FC<RelationshipsTableProps> = ({ relationships }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Source</th>
          <th>Target</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        {relationships.map((relationship, index) => (
          <tr key={index}>
            <td>{relationship.source}</td>
            <td>{relationship.target}</td>
            <td>{relationship.type}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default RelationshipsTable;
