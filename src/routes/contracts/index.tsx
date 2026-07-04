import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { createColumnHelper } from '@tanstack/react-table'
import { Upload } from 'lucide-react'
import { useAuth } from '../../lib/auth/auth'
import { useContracts, useUploadContract } from '../../lib/api/hooks'
import type { Contract } from '../../lib/api/types'
import { DataTable } from '../../lib/dashboard/DataTable'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  PageHeader,
  SectionTitle,
  Spinner,
  formatDate,
  shortId,
} from '../../lib/dashboard/ui'

export const Route = createFileRoute('/contracts/')({ component: Contracts })

const col = createColumnHelper<Contract>()

function Contracts() {
  const { isConnected } = useAuth()
  const contracts = useContracts()
  const navigate = useNavigate()
  const [showUpload, setShowUpload] = useState(false)

  const columns = useMemo(
    () => [
      col.accessor('name', {
        header: 'Name',
        cell: (c) => (
          <span className="font-semibold text-[var(--sea-ink)]">
            {c.getValue()}
          </span>
        ),
      }),
      col.accessor('language', {
        header: 'Language',
        cell: (c) => <span className="demo-pill">{c.getValue()}</span>,
      }),
      col.accessor('source_hash', {
        header: 'Hash',
        enableSorting: false,
        cell: (c) => (
          <code className="text-[0.72rem]">{shortId(c.getValue(), 12)}</code>
        ),
      }),
      col.accessor('uploaded_at', {
        header: 'Uploaded',
        cell: (c) => (
          <span className="text-[var(--sea-ink-soft)]">
            {formatDate(c.getValue())}
          </span>
        ),
      }),
    ],
    [],
  )

  const items = contracts.data?.items ?? []

  return (
    <>
      <PageHeader
        title="Contracts"
        subtitle="Upload Solidity sources, then run memory-augmented audits."
        actions={
          <Button onClick={() => setShowUpload((v) => !v)}>
            <Upload size={15} /> {showUpload ? 'Close' : 'Upload contract'}
          </Button>
        }
      />

      {showUpload && (
        <div className="mb-6">
          <UploadForm onDone={() => setShowUpload(false)} />
        </div>
      )}

      {!isConnected ? (
        <EmptyState title="Not connected" description="Connect a workspace first." />
      ) : contracts.isLoading ? (
        <Spinner label="Loading contracts…" />
      ) : contracts.error ? (
        <ErrorState error={contracts.error} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No contracts yet"
          description="Upload your first contract to start building audit memory."
          action={
            <Button onClick={() => setShowUpload(true)}>
              <Upload size={15} /> Upload contract
            </Button>
          }
        />
      ) : (
        <>
          <DataTable
            data={items}
            columns={columns}
            onRowClick={(c) =>
              navigate({
                to: '/contracts/$contractId',
                params: { contractId: c.id },
              })
            }
          />
          {contracts.hasNextPage && (
            <div className="mt-4">
              <Button
                variant="secondary"
                loading={contracts.isFetchingNextPage}
                onClick={() => contracts.fetchNextPage()}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </>
  )
}

const SAMPLE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Vault {
    mapping(address => uint256) public balances;
    function deposit() external payable { balances[msg.sender] += msg.value; }
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok);
        balances[msg.sender] = 0;
    }
}`

function UploadForm({ onDone }: { onDone: () => void }) {
  const upload = useUploadContract()
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: { name: '', language: 'solidity', source_code: '' },
    onSubmit: async ({ value }) => {
      const res = await upload.mutateAsync({
        name: value.name.trim(),
        language: value.language,
        source_code: value.source_code,
      })
      onDone()
      navigate({
        to: '/contracts/$contractId',
        params: { contractId: res.data.id },
      })
    },
  })

  return (
    <Card>
      <SectionTitle>Upload contract</SectionTitle>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                value.trim() ? undefined : 'Name is required',
            }}
          >
            {(field) => (
              <Field label="Name">
                <input
                  className="demo-input"
                  placeholder="MyToken"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors[0] && (
                  <span className="mt-1 block text-xs text-[#b42318]">
                    {String(field.state.meta.errors[0])}
                  </span>
                )}
              </Field>
            )}
          </form.Field>

          <form.Field name="language">
            {(field) => (
              <Field label="Language">
                <select
                  className="demo-select"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                >
                  <option value="solidity">Solidity</option>
                  <option value="move">Move</option>
                  <option value="aiken">Aiken</option>
                </select>
              </Field>
            )}
          </form.Field>
        </div>

        <form.Field
          name="source_code"
          validators={{
            onChange: ({ value }) =>
              value.trim().length < 20 ? 'Paste contract source' : undefined,
          }}
        >
          {(field) => (
            <Field label="Source code" hint="Paste .sol source (sent as multipart form-data).">
              <textarea
                className="demo-textarea font-mono text-[0.8rem]"
                rows={10}
                placeholder="pragma solidity ^0.8.0; …"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors[0] && (
                <span className="mt-1 block text-xs text-[#b42318]">
                  {String(field.state.meta.errors[0])}
                </span>
              )}
            </Field>
          )}
        </form.Field>

        {upload.error && <ErrorState error={upload.error} />}

        <div className="flex items-center gap-2">
          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" loading={isSubmitting} disabled={!canSubmit}>
                <Upload size={15} /> Upload
              </Button>
            )}
          </form.Subscribe>
          <Button
            type="button"
            variant="secondary"
            onClick={() => form.setFieldValue('source_code', SAMPLE)}
          >
            Insert sample
          </Button>
        </div>
      </form>
    </Card>
  )
}
