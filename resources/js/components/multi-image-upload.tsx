import { asset } from '@/components/public-site';
import { ImagePlus, Trash2 } from 'lucide-react';

export function MultiImageUpload({
    files,
    onChange,
    primary,
    onPrimaryChange,
    existing = [],
    onDeleteExisting,
}: {
    files: File[];
    onChange: (files: File[]) => void;
    primary: number;
    onPrimaryChange: (index: number) => void;
    existing?: { id?: number; image: string }[];
    onDeleteExisting?: (image: { id?: number; image: string }) => void;
}) {
    return (
        <div className="multi-upload">
            {existing.length > 0 && (
                <div className="existing-images">
                    <strong>Gambar tersimpan</strong>
                    <div>
                        {existing.map((image, index) => (
                            <figure key={image.id || index}>
                                <img
                                    src={asset(image.image)}
                                    alt={`Gambar tersimpan ${index + 1}`}
                                />
                                {image.id && onDeleteExisting && (
                                    <button
                                        type="button"
                                        onClick={() => onDeleteExisting(image)}
                                        aria-label={`Hapus gambar ${index + 1}`}
                                    >
                                        <Trash2 aria-hidden="true" />
                                    </button>
                                )}
                            </figure>
                        ))}
                    </div>
                </div>
            )}
            <label className="upload">
                <ImagePlus aria-hidden="true" /> Tambahkan beberapa gambar
                <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                        onChange(Array.from(event.target.files || []))
                    }
                />
            </label>
            {files.length > 0 && (
                <div className="upload-previews">
                    {files.map((file, index) => (
                        <label
                            key={`${file.name}-${file.lastModified}`}
                            className={primary === index ? 'primary' : ''}
                        >
                            <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${file.name}`}
                            />
                            <span>
                                <input
                                    type="radio"
                                    name="primary_image_preview"
                                    checked={primary === index}
                                    onChange={() => onPrimaryChange(index)}
                                />{' '}
                                Gambar utama
                            </span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
