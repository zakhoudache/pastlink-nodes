'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Edit, Trash, Search, Filter } from 'lucide-react';

interface Relationship {
  source: string;
  target: string;
  type: string;
}

interface RelationshipsTableProps {
  relationships: Relationship[];
  onEdit?: (relationship: Relationship, index: number) => void;
  onDelete?: (index: number) => void;
}

export default function RelationshipsTable({ 
  relationships,
  onEdit,
  onDelete
}: RelationshipsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Relationship | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<string | null>(null);

  // Get unique relationship types for filtering
  const relationshipTypes = Array.from(new Set(relationships.map(r => r.type)));

  // Handle sorting
  const handleSort = (field: keyof Relationship) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort relationships
  const filteredAndSortedRelationships = relationships
    .filter(relationship => {
      const matchesSearch = searchTerm === '' || 
        Object.values(relationship).some(value => 
          value.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesFilter = !filterType || relationship.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const aValue = a[sortField].toLowerCase();
      const bValue = b[sortField].toLowerCase();
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

  const getSortIcon = (field: keyof Relationship) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search relationships..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              {filterType || 'All Types'}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterType(null)}>
              All Types
            </DropdownMenuItem>
            {relationshipTypes.map((type) => (
              <DropdownMenuItem 
                key={type}
                onClick={() => setFilterType(type)}
              >
                {type}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('source')}
              >
                Source {getSortIcon('source')}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('type')}
              >
                Relationship Type {getSortIcon('type')}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('target')}
              >
                Target {getSortIcon('target')}
              </TableHead>
              {(onEdit || onDelete) && (
                <TableHead className="w-[100px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedRelationships.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={onEdit || onDelete ? 4 : 3} 
                  className="text-center text-muted-foreground"
                >
                  No relationships found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedRelationships.map((relationship, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {relationship.source}
                  </TableCell>
                  <TableCell>{relationship.type}</TableCell>
                  <TableCell>{relationship.target}</TableCell>
                  {(onEdit || onDelete) && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(relationship, index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-sm text-muted-foreground text-right">
        Total relationships: {filteredAndSortedRelationships.length}
      </div>
    </div>
  );
}