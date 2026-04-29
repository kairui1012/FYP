import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type TransFn = (key: string) => string;

type Column<T> = {
    key: string;
    header: string;
    render: (item: T) => string | number;
    className?: string;
};

type InsightsDataTableProps<T> = {
    items: T[];
    columns: Column<T>[];
    getRowKey: (item: T) => string;
    trans: TransFn;
};

export function InsightsDataTable<T>({
    items,
    columns,
    getRowKey,
    trans,
}: InsightsDataTableProps<T>) {
    if (items.length === 0) {
        return (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
                {trans('createPost.teacher_empty')}
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow className="border-zinc-200 hover:bg-transparent">
                    {columns.map((column) => (
                        <TableHead
                            key={column.key}
                            className="text-xs font-semibold tracking-wide text-zinc-500 uppercase"
                        >
                            {column.header}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow
                        key={getRowKey(item)}
                        className="border-zinc-100 hover:bg-zinc-50/70"
                    >
                        {columns.map((column) => (
                            <TableCell
                                key={column.key}
                                className={
                                    column.className ?? 'text-sm text-zinc-700'
                                }
                            >
                                {column.render(item)}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
