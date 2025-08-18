import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Modal } from "./Modal";
import { Button } from "../Button/Button";

const meta: Meta<typeof Modal> = {
  title: "Components/Modal",
  component: Modal,
};

export default meta;

type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Default Modal</Button>
        <Modal open={open} onOpenChange={setOpen} title="Default Modal">
          <p>Ini konten modal default.</p>
        </Modal>
      </>
    );
  },
};

export const Confirm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Confirm Modal</Button>
        <Modal
          open={open}
          onOpenChange={setOpen}
          title="Konfirmasi"
          description="Apakah Anda yakin ingin menghapus data ini?"
          variant="confirm"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button color="danger" onClick={() => setOpen(false)}>
                Hapus
              </Button>
            </div>
          }
        />
      </>
    );
  },
};

export const Success: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Success Modal</Button>
        <Modal
          open={open}
          onOpenChange={setOpen}
          title="Berhasil!"
          description="Data berhasil disimpan ke sistem."
          variant="success"
          footer={
            <div className="flex justify-end">
              <Button onClick={() => setOpen(false)}>Tutup</Button>
            </div>
          }
        />
      </>
    );
  },
};

export const Message: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Message Modal</Button>
        <Modal
          open={open}
          onOpenChange={setOpen}
          title="Informasi"
          description="Server akan mengalami pemeliharaan pada pukul 01:00 - 02:00 WIB."
          variant="info"
          footer={
            <div className="flex justify-end">
              <Button onClick={() => setOpen(false)}>Mengerti</Button>
            </div>
          }
        />
      </>
    );
  },
};

export const Promo: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Promo Modal</Button>
        <Modal
          open={open}
          onOpenChange={setOpen}
          title="Promo Spesial!"
          variant="promo"
          footer={
            <div className="flex justify-end">
              <Button onClick={() => setOpen(false)}>Tutup</Button>
            </div>
          }
        >
          <img
            src="https://via.placeholder.com/400x150"
            alt="Promo"
            className="w-full rounded mb-4"
          />
          <p className="text-sm">
            Dapatkan diskon hingga <strong>50%</strong> untuk pendaftaran kelas
            baru. Promo berlaku hingga akhir bulan ini!
          </p>
        </Modal>
      </>
    );
  },
};

export const Warning: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Warning Modal</Button>
        <Modal
          open={open}
          onOpenChange={setOpen}
          title="Peringatan"
          description="Anda akan menghapus data yang tidak dapat dikembalikan."
          variant="warning"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button color="danger" onClick={() => setOpen(false)}>
                Hapus Permanen
              </Button>
            </div>
          }
        />
      </>
    );
  },
};

export const Form: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Form Modal</Button>
        <Modal
          open={open}
          onOpenChange={setOpen}
          title="Tambah Data"
          variant="form"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button onClick={() => setOpen(false)}>Simpan</Button>
            </div>
          }
        >
          <form className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium block mb-1">
                Nama
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Masukkan nama"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Masukkan email"
              />
            </div>
          </form>
        </Modal>
      </>
    );
  },
};
