import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    BlockQuote,
    Bold,
    ClassicEditor,
    Essentials,
    Heading,
    Italic,
    Link,
    List,
    Paragraph,
    Undo,
} from 'ckeditor5';

export function RichTextEditor({
    value,
    onChange,
    label,
}: {
    value: string;
    onChange: (value: string) => void;
    label: string;
}) {
    return (
        <div className="rich-editor" aria-label={label}>
            <CKEditor
                editor={ClassicEditor}
                data={value || ''}
                config={{
                    licenseKey: 'GPL',
                    plugins: [
                        Essentials,
                        Paragraph,
                        Heading,
                        Bold,
                        Italic,
                        Link,
                        List,
                        BlockQuote,
                        Undo,
                    ],
                    toolbar: [
                        'undo',
                        'redo',
                        '|',
                        'heading',
                        '|',
                        'bold',
                        'italic',
                        'link',
                        '|',
                        'bulletedList',
                        'numberedList',
                        'blockQuote',
                    ],
                }}
                onChange={(_, editor) => onChange(editor.getData())}
            />
        </div>
    );
}

export function RichText({
    html,
    className = '',
}: {
    html?: string;
    className?: string;
}) {
    if (!html) return null;
    return (
        <div
            className={`rich-text ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
