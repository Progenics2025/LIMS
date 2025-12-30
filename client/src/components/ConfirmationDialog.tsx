import * as React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2, Edit, Info } from "lucide-react";

export type ConfirmationType = "delete" | "edit" | "warning" | "info";

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    type?: ConfirmationType;
    isLoading?: boolean;
}

const typeStyles: Record<ConfirmationType, { icon: React.ReactNode; buttonClass: string; iconBgClass: string }> = {
    delete: {
        icon: <Trash2 className="h-6 w-6 text-red-600" />,
        buttonClass: "bg-red-600 hover:bg-red-700 text-white",
        iconBgClass: "bg-red-100 dark:bg-red-900/30",
    },
    edit: {
        icon: <Edit className="h-6 w-6 text-amber-600" />,
        buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
        iconBgClass: "bg-amber-100 dark:bg-amber-900/30",
    },
    warning: {
        icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
        buttonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
        iconBgClass: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    info: {
        icon: <Info className="h-6 w-6 text-blue-600" />,
        buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
        iconBgClass: "bg-blue-100 dark:bg-blue-900/30",
    },
};

export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    type = "warning",
    isLoading = false,
}: ConfirmationDialogProps) {
    const styles = typeStyles[type];

    const handleCancel = () => {
        onCancel?.();
        onOpenChange(false);
    };

    const handleConfirm = () => {
        onConfirm();
        // Don't close automatically - let the parent handle it after async operations complete
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 rounded-full p-3 ${styles.iconBgClass}`}>
                            {styles.icon}
                        </div>
                        <div className="flex-1">
                            <AlertDialogTitle className="text-lg font-semibold">
                                {title}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">
                                {description}
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={styles.buttonClass}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Processing...
                            </span>
                        ) : (
                            confirmText
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Convenience hooks for managing confirmation dialogs
export function useConfirmationDialog() {
    const [state, setState] = React.useState<{
        open: boolean;
        type: ConfirmationType;
        title: string;
        description: string;
        confirmText: string;
        onConfirm: () => void;
        isLoading: boolean;
    }>({
        open: false,
        type: "warning",
        title: "",
        description: "",
        confirmText: "Confirm",
        onConfirm: () => { },
        isLoading: false,
    });

    const showConfirmation = React.useCallback(
        (options: {
            type?: ConfirmationType;
            title: string;
            description: string;
            confirmText?: string;
            onConfirm: () => void;
        }) => {
            setState({
                open: true,
                type: options.type || "warning",
                title: options.title,
                description: options.description,
                confirmText: options.confirmText || "Confirm",
                onConfirm: options.onConfirm,
                isLoading: false,
            });
        },
        []
    );

    const hideConfirmation = React.useCallback(() => {
        setState((prev) => ({ ...prev, open: false }));
    }, []);

    const setLoading = React.useCallback((loading: boolean) => {
        setState((prev) => ({ ...prev, isLoading: loading }));
    }, []);

    const confirmDelete = React.useCallback(
        (options: { title?: string; description?: string; onConfirm: () => void }) => {
            showConfirmation({
                type: "delete",
                title: options.title || "Delete Record",
                description:
                    options.description ||
                    "Are you sure you want to delete this record? This action cannot be undone.",
                confirmText: "Delete",
                onConfirm: options.onConfirm,
            });
        },
        [showConfirmation]
    );

    const confirmEdit = React.useCallback(
        (options: { title?: string; description?: string; onConfirm: () => void }) => {
            showConfirmation({
                type: "edit",
                title: options.title || "Save Changes",
                description:
                    options.description ||
                    "Are you sure you want to save these changes? This will update the existing record.",
                confirmText: "Save Changes",
                onConfirm: options.onConfirm,
            });
        },
        [showConfirmation]
    );

    return {
        ...state,
        onOpenChange: (open: boolean) => setState((prev) => ({ ...prev, open })),
        showConfirmation,
        hideConfirmation,
        setLoading,
        confirmDelete,
        confirmEdit,
    };
}
