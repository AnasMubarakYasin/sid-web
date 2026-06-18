"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  DataGrid,
  GridActionsCellItem,
  GridRowId,
  GridActionsCell,
  GridRenderCellParams,
  GridDataSource,
  Toolbar,
  ToolbarButton,
  useGridApiContext,
  FilterPanelTrigger,
  ColumnsPanelTrigger,
  GridGetRowsResponse,
  GridUpdateRowParams,
  QuickFilterControl,
  QuickFilterTrigger,
  QuickFilter,
  QuickFilterClear,
  GridApi,
  GridGetRowsParams,
  GridSlotProps,
} from "@mui/x-data-grid";

import { styled } from "@mui/material/styles";

import Tooltip from "@mui/material/Tooltip";
import Badge from "@mui/material/Badge";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";

import { useDashboardStore } from "@/store/dashboard";
import { create, update, remove, list, setToken, Subject } from "@/api/subject";

import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CancelIcon from "@mui/icons-material/Cancel";
import SearchIcon from "@mui/icons-material/Search";

import { useUserStore } from "@/store/user";

const StyledQuickFilter = styled(QuickFilter)({
  display: "grid",
  alignItems: "center",
});

const StyledToolbarButton = styled(ToolbarButton)<{ ownerState: any }>(
  ({ theme, ownerState }) => ({
    gridArea: "1 / 1",
    width: "min-content",
    height: "min-content",
    zIndex: 1,
    opacity: ownerState.expanded ? 0 : 1,
    pointerEvents: ownerState.expanded ? "none" : "auto",
    transition: theme.transitions.create(["opacity"]),
  }),
);

const StyledTextField = styled(TextField)<{
  ownerState: any;
}>(({ theme, ownerState }) => ({
  gridArea: "1 / 1",
  overflowX: "clip",
  width: ownerState.expanded ? 260 : "var(--trigger-width)",
  height: "40px",
  opacity: ownerState.expanded ? 1 : 0,
  transition: theme.transitions.create(["width", "opacity"]),
}));

function CustomToolbar(props: GridSlotProps["toolbar"]) {
  const { loading, setLoading, setToast } = useDashboardStore();
  const apiRef = useGridApiContext();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const handleClose = () => {
    setPanelOpen(false);
  };
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      handleClose();
    }
  };
  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    try {
      event.preventDefault();
      setLoading(true);
      const form = new FormData(event.target);
      const response = await create({
        title: form.get("title") as string,
        description: form.get("description") as string,
        video: form.get("video") as string,
        questions: (form.get("questions") as string).split("\n"),
      });
      handleClose();
    } catch (error: any) {
      setToast({ level: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Toolbar>
      <StyledQuickFilter>
        <QuickFilterTrigger
          render={(triggerProps, state) => (
            <Tooltip title="Search" enterDelay={0}>
              <StyledToolbarButton
                {...triggerProps}
                ownerState={{ expanded: state.expanded }}
                color="default"
                aria-disabled={state.expanded}
              >
                <SearchIcon fontSize="small" />
              </StyledToolbarButton>
            </Tooltip>
          )}
        />
        <QuickFilterControl
          render={({ ref, ...controlProps }, state) => (
            <StyledTextField
              {...controlProps}
              ownerState={{ expanded: state.expanded }}
              inputRef={ref}
              aria-label="Search"
              placeholder="Search..."
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: state.value ? (
                    <InputAdornment position="end">
                      <QuickFilterClear
                        edge="end"
                        size="small"
                        aria-label="Clear search"
                        material={{ sx: { marginRight: -0.75 } }}
                      >
                        <CancelIcon fontSize="small" />
                      </QuickFilterClear>
                    </InputAdornment>
                  ) : null,
                  ...controlProps.slotProps?.input,
                },
                ...controlProps.slotProps,
              }}
            />
          )}
        />
      </StyledQuickFilter>
      <Tooltip title="Columns">
        <ColumnsPanelTrigger render={<ToolbarButton />}>
          <ViewColumnIcon fontSize="small" />
        </ColumnsPanelTrigger>
      </Tooltip>
      <Tooltip title="Filters">
        <FilterPanelTrigger
          render={(props, state) => (
            <ToolbarButton {...props} color="default">
              <Badge
                badgeContent={state.filterCount}
                color="primary"
                variant="dot"
              >
                <FilterListIcon fontSize="small" />
              </Badge>
            </ToolbarButton>
          )}
        />
      </Tooltip>
      <Divider
        orientation="vertical"
        variant="middle"
        flexItem
        sx={{ mx: 0.5 }}
      />
      <Tooltip title="Add Subject">
        <ToolbarButton
          ref={buttonRef}
          aria-describedby="add-menu"
          onClick={() => setPanelOpen((prev) => !prev)}
        >
          <AddIcon fontSize="small" />
        </ToolbarButton>
      </Tooltip>
      <Popper
        open={panelOpen}
        anchorEl={() => buttonRef.current!}
        placement="bottom-end"
        onKeyDown={handleKeyDown}
        id="add-menu"
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            sx={{
              display: "flex",
              flexDirection: "column",
              width: 320,
              gap: 2,
              p: 2,
            }}
            elevation={8}
          >
            <Typography sx={{ fontWeight: "bold" }}>Add Subject</Typography>
            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Title"
                  name="title"
                  size="small"
                  fullWidth
                  required
                  disabled={loading}
                  autoFocus
                />
                <TextField
                  label="Description"
                  name="description"
                  size="small"
                  fullWidth
                  required
                  disabled={loading}
                  multiline
                  minRows={2}
                />
                <TextField
                  label="Video URL"
                  type="url"
                  name="video"
                  size="small"
                  fullWidth
                  required
                  disabled={loading}
                />
                <TextField
                  label="Questions"
                  name="questions"
                  size="small"
                  fullWidth
                  required
                  disabled={loading}
                  multiline
                  minRows={2}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  loading={loading}
                >
                  Add
                </Button>
              </Stack>
            </form>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Toolbar>
  );
}

interface ActionHandlers {
  onEdit: (id: GridRowId) => void;
  onDelete: (id: GridRowId) => void;
}

function ActionsCell(props: GridRenderCellParams) {
  const { loading, setLoading, setToast } = useDashboardStore();
  const apiRef = useGridApiContext();
  const editRef = useRef<HTMLButtonElement>(null);
  const formEditRef = useRef<HTMLFormElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const handleEditClose = () => {
    setEditOpen(false);
  };
  const handleEditKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      handleEditClose();
    }
  };
  const handleEditSubmit = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ) => {
    try {
      event.preventDefault();
      setLoading(true);
      const form = new FormData(event.target);
      await apiRef.current.dataSource.editRow({
        rowId: props.id,
        previousRow: props.row,
        updatedRow: {
          id: props.id as number,
          title: form.get("title"),
          description: form.get("description"),
          video: form.get("video"),
          questions: (form.get("questions") as string).split("\n"),
        },
      });
      // apiRef.current.autosizeColumns({ expand: true });
      handleEditClose();
    } catch (error: any) {
      setToast({ level: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };
  function onEdit() {
    setEditOpen(true);
  }
  async function onDelete() {
    try {
      setLoading(true);
      const response = await remove({ id: props.id as number });
      // apiRef.current.autosizeColumns({ expand: true });
    } catch (error: any) {
      setToast({ level: "error", message: error.message });
      handleEditClose();
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (editOpen) {
      setTimeout(() => {
        (
          formEditRef.current!.elements.namedItem("title") as HTMLInputElement
        ).value = props.row.title;
        (
          formEditRef.current!.elements.namedItem(
            "description",
          ) as HTMLInputElement
        ).value = props.row.description;
        (
          formEditRef.current!.elements.namedItem("video") as HTMLInputElement
        ).value = props.row.video;
        (
          formEditRef.current!.elements.namedItem(
            "questions",
          ) as HTMLInputElement
        ).value = props.row.questions.join("\n");
      });
    }
  }, [editOpen, formEditRef]);
  return (
    <>
      <GridActionsCell {...props}>
        <GridActionsCellItem
          ref={editRef}
          icon={<EditIcon />}
          label="Edit"
          onClick={onEdit}
          disabled={loading}
        />
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={onDelete}
          disabled={loading}
        />
      </GridActionsCell>
      <Popper
        open={editOpen}
        anchorEl={() => editRef.current!}
        placement="bottom-end"
        onKeyDown={handleEditKeyDown}
        id="edit-menu"
        // keepMounted
      >
        <ClickAwayListener onClickAway={handleEditClose}>
          <Paper
            sx={{
              display: "flex",
              flexDirection: "column",
              width: 320,
              gap: 2,
              p: 2,
            }}
            elevation={8}
          >
            <Typography sx={{ fontWeight: "bold" }}>Edit Subject</Typography>
            <form ref={formEditRef} onSubmit={handleEditSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Title"
                  name="title"
                  size="small"
                  fullWidth
                  required
                  disabled={loading}
                  autoFocus
                />
                <TextField
                  label="Description"
                  name="description"
                  size="small"
                  fullWidth
                  required
                  disabled={loading}
                  multiline
                  minRows={2}
                />
                <TextField
                  label="Video URL"
                  type="url"
                  name="video"
                  size="small"
                  fullWidth
                  required
                  disabled={loading}
                />
                <TextField
                  label="Questions"
                  name="questions"
                  size="small"
                  fullWidth
                  required
                  disabled={loading}
                  multiline
                  minRows={2}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  loading={loading}
                >
                  Update
                </Button>
              </Stack>
            </form>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
}

export default function Page() {
  const { setTitle, setLoading, setToast } = useDashboardStore();
  const { token } = useUserStore();
  const apiRef = useRef<GridApi>(null);

  const dataSource: GridDataSource = {
    getRows: async (
      params: GridGetRowsParams,
    ): Promise<GridGetRowsResponse> => {
      const response = await list();
      return {
        rows: response.data,
        rowCount: response.data.length,
      };
    },
    updateRow: async (params: GridUpdateRowParams) => {
      const response = await update(params.updatedRow as Subject);
      return response.data;
    },
  };
  function resize() {
    setTimeout(() => {
      apiRef.current!.autosizeColumns({
        disableColumnVirtualization: true,
        includeOutliers: true,
        includeHeaders: true,
        expand: true,
      });
    }, 300);
  }

  useLayoutEffect(() => {
    setTitle("Subject");
    setLoading(false);
  }, []);
  useLayoutEffect(() => {
    setToken(token!);
    return () => setToken("");
  }, [token]);
  useEffect(() => {
    apiRef.current!.subscribeEvent("rowCountChange", resize);
  }, [apiRef]);

  return (
    <div className="w-container h-stretch">
      <DataGrid
        apiRef={apiRef}
        showToolbar
        slots={{ toolbar: CustomToolbar }}
        dataSource={dataSource}
        dataSourceCache={null}
        dataSourceRevalidateMs={1e3 * 60}
        onDataSourceError={(error) => {
          resize();
          setToast({ level: "error", message: error.message });
        }}
        columns={[
          {
            field: "title",
            headerName: "Title",
            type: "string",
          },
          {
            field: "description",
            headerName: "Description",
            type: "longText",
          },
          {
            field: "video",
            headerName: "Video URL",
            type: "string",
          },
          {
            field: "questions",
            headerName: "Questions",
            type: "longText",
            valueGetter: (value?: string[]) => value?.join("\n") ?? "",
          },
          {
            field: "actions",
            type: "actions",
            renderCell: (params) => <ActionsCell {...params} />,
          },
        ]}
        autosizeOnMount
        autosizeOptions={{
          expand: true,
          includeHeaders: true,
          includeOutliers: true,
        }}
        pagination
      />
    </div>
  );
}
