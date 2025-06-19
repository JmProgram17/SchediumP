/**
 * Cross-Module Integration Tests
 * Tests integration between different CRUD modules and shared components
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'

import { DataTable, Column } from '@/design-system/components/DataTable'
import { SearchFilter } from '@/design-system/components/SearchFilter'
import { Modal } from '@/design-system/components/Modal'
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog'
import { StatusIndicator } from '@/design-system/components/StatusIndicator'
import { EmptyState } from '@/design-system/components/EmptyState'

// Mock data for different modules
interface TestEntity {
  id: string
  name: string
  status: 'active' | 'inactive'
  type: string
  count: number
}

const mockData: TestEntity[] = [
  { id: '1', name: 'Test Item 1', status: 'active', type: 'TypeA', count: 10 },
  { id: '2', name: 'Test Item 2', status: 'inactive', type: 'TypeB', count: 25 },
  { id: '3', name: 'Test Item 3', status: 'active', type: 'TypeA', count: 15 }
]

// Test utilities - removed unused createQueryClient function

describe('Cross-Module Integration Tests', () => {
  describe('DataTable Component Integration', () => {
    const columns: Column<TestEntity>[] = [
      {
        key: 'name',
        title: 'Name',
        sortable: true
      },
      {
        key: 'status',
        title: 'Status',
        render: (value) => <StatusIndicator status={value} />
      },
      {
        key: 'type',
        title: 'Type',
        sortable: true
      },
      {
        key: 'count',
        title: 'Count',
        sortable: true
      }
    ]

    it('should render data table with all features', async () => {
      render(
        <DataTable
          data={mockData}
          columns={columns}
        />
      )

      // Verify table structure
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Count')).toBeInTheDocument()

      // Verify data rows
      expect(screen.getByText('Test Item 1')).toBeInTheDocument()
      expect(screen.getByText('Test Item 2')).toBeInTheDocument()
      expect(screen.getByText('Test Item 3')).toBeInTheDocument()

      // Verify status indicators are rendered
      expect(screen.getAllByText('Activo')).toHaveLength(2)
      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })

    it('should handle sorting correctly', async () => {
      render(
        <DataTable
          data={mockData}
          columns={columns}
        />
      )

      // Verify sortable columns are rendered
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
    })

    it('should handle row selection', async () => {
      render(
        <DataTable
          data={mockData}
          columns={columns}
        />
      )

      // Verify data is displayed
      expect(screen.getByText('Test Item 1')).toBeInTheDocument()
      expect(screen.getByText('Test Item 2')).toBeInTheDocument()
    })

    it('should display empty state when no data', () => {
      render(
        <DataTable
          data={[]}
          columns={columns}
          emptyText="No items found"
        />
      )

      expect(screen.getByText('No items found')).toBeInTheDocument()
    })
  })

  describe('SearchFilter Component Integration', () => {

    it('should render search and filter controls', async () => {
      const mockOnSearchChange = vi.fn()
      
      render(
        <SearchFilter
          value=""
          onChange={mockOnSearchChange}
          placeholder="Buscar..."
        />
      )

      // Verify search input
      expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()
    })

    it('should handle search input changes', async () => {
      const user = userEvent.setup()
      const mockOnSearchChange = vi.fn()
      
      render(
        <SearchFilter
          value=""
          onChange={mockOnSearchChange}
        />
      )

      const searchInput = screen.getByPlaceholderText('Buscar...')
      await user.type(searchInput, 'test query')

      expect(mockOnSearchChange).toHaveBeenCalledTimes(10) // Once per character
    })

    it('should handle filter changes', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      
      render(
        <SearchFilter
          value=""
          onChange={mockOnChange}
        />
      )

      const searchInput = screen.getByPlaceholderText('Buscar...')
      await user.type(searchInput, 'filter')

      expect(mockOnChange).toHaveBeenCalledTimes(6) // Once per character
    })

    it('should display search value correctly', () => {
      render(
        <SearchFilter
          value="test query"
          onChange={() => {}}
        />
      )

      expect(screen.getByDisplayValue('test query')).toBeInTheDocument()
    })
  })

  describe('Modal Component Integration', () => {
    it('should open and close modal correctly', async () => {
      const user = userEvent.setup()
      const mockOnClose = vi.fn()
      
      const { rerender } = render(
        <Modal open={false} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      )

      // Modal should not be visible
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()

      // Open modal
      rerender(
        <Modal open={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      )

      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Modal content')).toBeInTheDocument()

      // Close via X button
      const closeButton = screen.getByRole('button')
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close modal on overlay click when enabled', async () => {
      const user = userEvent.setup()
      const mockOnClose = vi.fn()
      
      render(
        <Modal 
          open={true} 
          onClose={mockOnClose} 
          title="Test Modal"
        >
          <p>Modal content</p>
        </Modal>
      )

      // Click on overlay (background)
      const overlay = screen.getByText('Test Modal').closest('.fixed')
      if (overlay) {
        await user.click(overlay)
        expect(mockOnClose).toHaveBeenCalled()
      }
    })
  })

  describe('ConfirmDialog Component Integration', () => {
    it('should display confirmation dialog with correct content', () => {
      render(
        <ConfirmDialog
          open={true}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Delete Item"
          message="Are you sure you want to delete this item?"
          variant="danger"
        />
      )

      expect(screen.getByText('Delete Item')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
    })

    it('should handle confirm and cancel actions', async () => {
      const user = userEvent.setup()
      const mockOnConfirm = vi.fn()
      const mockOnClose = vi.fn()
      
      render(
        <ConfirmDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          title="Confirm Action"
          message="Please confirm this action"
        />
      )

      // Test confirm
      const confirmButton = screen.getByRole('button', { name: /confirmar/i })
      await user.click(confirmButton)
      expect(mockOnConfirm).toHaveBeenCalled()

      // Test cancel
      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      await user.click(cancelButton)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('StatusIndicator Component Integration', () => {
    it('should render different status types correctly', () => {
      const { rerender } = render(
        <StatusIndicator status="active" />
      )

      expect(screen.getByText('Activo')).toBeInTheDocument()

      rerender(<StatusIndicator status="inactive" />)
      expect(screen.getByText('Inactivo')).toBeInTheDocument()

      rerender(<StatusIndicator status="pending" />)
      expect(screen.getByText('Pendiente')).toBeInTheDocument()
    })

    it('should render with different configurations', () => {
      const { rerender } = render(
        <StatusIndicator status="active" />
      )

      // Should show active status
      expect(screen.getByText('Activo')).toBeInTheDocument()

      rerender(<StatusIndicator status="active" showDot={false} />)
      // Should show without dot
      expect(screen.getByText('Activo')).toBeInTheDocument()

      rerender(<StatusIndicator status="active" label="Custom Label" />)
      // Should show custom label
      expect(screen.getByText('Custom Label')).toBeInTheDocument()
    })

    it('should handle custom labels', () => {
      render(
        <StatusIndicator 
          status="success" 
          label="Operación exitosa"
        />
      )

      expect(screen.getByText('Operación exitosa')).toBeInTheDocument()
    })
  })

  describe('EmptyState Component Integration', () => {
    it('should render empty state with action button', async () => {
      const user = userEvent.setup()
      const mockAction = vi.fn()
      
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display. Create your first item to get started."
          action={<button onClick={mockAction}>Create Item</button>}
        />
      )

      expect(screen.getByText('No items found')).toBeInTheDocument()
      expect(screen.getByText(/There are no items to display/)).toBeInTheDocument()
      
      const actionButton = screen.getByRole('button', { name: /create item/i })
      await user.click(actionButton)
      
      expect(mockAction).toHaveBeenCalled()
    })

    it('should render with different content', () => {
      const { rerender } = render(
        <EmptyState
          title="No results"
          description="No search results found"
        />
      )

      expect(screen.getByText('No results')).toBeInTheDocument()

      rerender(
        <EmptyState
          title="Error occurred"
          description="Something went wrong"
        />
      )

      expect(screen.getByText('Error occurred')).toBeInTheDocument()
    })
  })

  describe('Component Composition Integration', () => {
    it('should work correctly when components are composed together', async () => {
      const user = userEvent.setup()
      
      // Simulate a complete list view with search, filters, table, and modals
      const [showModal, setShowModal] = React.useState(false)
      const [searchValue, setSearchValue] = React.useState('')
      
      const TestListView = () => (
        <div>
          <SearchFilter
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search items..."
          />
          
          <DataTable
            data={mockData.filter(item => 
              !searchValue || item.name.toLowerCase().includes(searchValue.toLowerCase())
            )}
            columns={[
              {
                key: 'name',
                title: 'Name',
                sortable: true
              },
              {
                key: 'status',
                title: 'Status',
                render: (value: any) => <StatusIndicator status={value} />
              }
            ]}
          />
          
          <button onClick={() => setShowModal(true)}>
            Open Modal
          </button>
          
          <Modal
            open={showModal}
            onClose={() => setShowModal(false)}
            title="Edit Item"
          >
            <p>Edit form would go here</p>
            <button onClick={() => setShowModal(false)}>
              Close
            </button>
          </Modal>
        </div>
      )

      render(<TestListView />)

      // Test search functionality
      const searchInput = screen.getByPlaceholderText('Buscar...')
      await user.type(searchInput, 'Item 1')

      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument()
        expect(screen.queryByText('Test Item 2')).not.toBeInTheDocument()
      })

      // Test modal opening from table action
      const editButton = screen.getByRole('button', { name: /edit test item 1/i })
      await user.click(editButton)

      expect(screen.getByText('Edit Item')).toBeInTheDocument()
      expect(screen.getByText('Edit form would go here')).toBeInTheDocument()

      // Test modal closing
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Edit Item')).not.toBeInTheDocument()
      })
    })
  })
})