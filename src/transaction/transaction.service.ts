// src/transaction/transaction.service.ts
// ============================================================
// SERVICE INI ADALAH INTI DARI SISTEM TRANSAKSI MIE GACOAN
// ============================================================

import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionService {
    constructor(private prisma: PrismaService) { }

    // ─────────────────────────────────────────────────────────────
    // METHOD: createOrder
    // Akses: PEMBELI
    // Alur: Validasi Stok → Validasi Saldo → Eksekusi Transaksi
    // ─────────────────────────────────────────────────────────────
    async createOrder(userId: number, dto: CreateTransactionDto) {
        // ┌─────────────────────────────────────────────────────────┐
        // │  STEP 1: Ambil semua data menu yang dipesan sekaligus   │
        // │  (1 query untuk semua item, lebih efisien)              │
        // └─────────────────────────────────────────────────────────┘
        const menuIds = dto.items.map((item) => item.menuId);
        const menus = await this.prisma.menu.findMany({
            where: { id: { in: menuIds } },
        });

        // Pastikan semua menu yang dipesan ada di database
        if (menus.length !== menuIds.length) {
            const foundIds = menus.map((m) => m.id);
            const notFoundIds = menuIds.filter((id) => !foundIds.includes(id));
            throw new NotFoundException(
                `Menu dengan ID [${notFoundIds.join(', ')}] tidak ditemukan`,
            );
        }

        // Buat map (dictionary) untuk akses cepat: menuId → data menu
        // Ini menghindari loop O(n²) saat menghitung harga
        const menuMap = new Map(menus.map((m) => [m.id, m]));

        // ┌─────────────────────────────────────────────────────────┐
        // │  STEP 2: VALIDASI STOK                                  │
        // │  Cek semua item sebelum eksekusi — gagal cepat (fail    │
        // │  fast) agar tidak perlu rollback jika ada yang kosong   │
        // └─────────────────────────────────────────────────────────┘
        for (const item of dto.items) {
            const menu = menuMap.get(item.menuId);

            if (!menu) {
                throw new NotFoundException(`Menu dengan ID ${item.menuId} tidak ditemukan`);
            }

            // Cek apakah stok tersedia
            if (menu.stock < item.quantity) {
                throw new BadRequestException(
                    `Stok "${menu.name}" tidak cukup. ` +
                    `Tersedia: ${menu.stock}, Diminta: ${item.quantity}`,
                );
            }

            // Cek jika stok = 0 (menu tidak tersedia)
            if (menu.stock === 0) {
                throw new BadRequestException(`Menu "${menu.name}" sedang habis`);
            }
        }

        // ┌─────────────────────────────────────────────────────────┐
        // │  STEP 3: HITUNG TOTAL HARGA                             │
        // └─────────────────────────────────────────────────────────┘
        const totalPrice = dto.items.reduce((total, item) => {
            const menu = menuMap.get(item.menuId)!;
            return total + menu.price * item.quantity;
        }, 0);

        // ┌─────────────────────────────────────────────────────────┐
        // │  STEP 4: VALIDASI SALDO PEMBELI                         │
        // └─────────────────────────────────────────────────────────┘
        const buyer = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!buyer) {
            throw new NotFoundException(`User dengan ID ${userId} tidak ditemukan`);
        }

        if (buyer.balance < totalPrice) {
            throw new BadRequestException(
                `Saldo tidak cukup. ` +
                `Saldo kamu: Rp${buyer.balance.toLocaleString('id-ID')}, ` +
                `Total belanja: Rp${totalPrice.toLocaleString('id-ID')}`,
            );
        }

        // ┌─────────────────────────────────────────────────────────────┐
        // │  STEP 5: EKSEKUSI TRANSAKSI (PRISMA TRANSACTION)            │
        // │                                                             │
        // │  Prisma Transaction memastikan SEMUA operasi di bawah ini   │
        // │  berhasil semuanya, atau GAGAL semuanya (ATOMICITY).        │
        // │                                                             │
        // │  Bayangkan ini seperti "bundel operasi" — jika satu gagal,  │
        // │  semua perubahan sebelumnya di-rollback secara otomatis.    │
        // │  Ini KRUSIAL untuk sistem keuangan agar data selalu         │
        // │  konsisten dan tidak terjadi "uang terpotong tapi stok      │
        // │  tidak berkurang" atau sebaliknya.                          │
        // └─────────────────────────────────────────────────────────────┘
        const order = await this.prisma.$transaction(async (tx) => {
            // ── 5a. Kurangi stok setiap menu ──────────────────────────
            //    Menggunakan prisma.menu.update dengan decrement
            //    agar tidak terjadi race condition (thread-safe)
            for (const item of dto.items) {
                await tx.menu.update({
                    where: { id: item.menuId },
                    data: {
                        stock: {
                            decrement: item.quantity, // stock = stock - quantity
                        },
                    },
                });
            }

            // ── 5b. Kurangi saldo pembeli ──────────────────────────────
            await tx.user.update({
                where: { id: userId },
                data: {
                    balance: {
                        decrement: totalPrice, // balance = balance - totalPrice
                    },
                },
            });

            // ── 5c. Buat record Order (header transaksi) ───────────────
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    totalPrice,
                    // Buat OrderItem untuk setiap menu yang dipesan (nested create)
                    orderItems: {
                        create: dto.items.map((item) => ({
                            menuId: item.menuId,
                            quantity: item.quantity,
                            price: menuMap.get(item.menuId)!.price, // Snapshot harga saat ini
                        })),
                    },
                },
                // Sertakan relasi untuk generate nota
                include: {
                    user: { select: { id: true, name: true } },
                    orderItems: {
                        include: {
                            menu: { select: { name: true, price: true } },
                        },
                    },
                },
            });

            return newOrder;
        });
        // ─── Akhir dari Prisma Transaction ───────────────────────────

        // ┌─────────────────────────────────────────────────────────┐
        // │  STEP 6: FORMAT NOTA TRANSAKSI (OUTPUT)                 │
        // └─────────────────────────────────────────────────────────┘
        return this.formatNota(order);
    }

    // ─────────────────────────────────────────────────────────────
    // METHOD: getAllOrders
    // Akses: KASIR - Melihat semua transaksi dengan detail lengkap
    // ─────────────────────────────────────────────────────────────
    async getAllOrders() {
        const orders = await this.prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
                orderItems: {
                    include: {
                        menu: { select: { name: true } },
                    },
                },
            },
        });

        // Format tampilan untuk setiap order
        return orders.map((order) => ({
            orderId: order.id,
            tanggal: order.createdAt,
            pembeli: order.user,
            items: order.orderItems.map((oi) => ({
                menu: oi.menu.name,
                quantity: oi.quantity,
                hargaSatuan: `Rp${oi.price.toLocaleString('id-ID')}`,
                subtotal: `Rp${(oi.price * oi.quantity).toLocaleString('id-ID')}`,
            })),
            totalBayar: `Rp${order.totalPrice.toLocaleString('id-ID')}`,
        }));
    }

    // ─────────────────────────────────────────────────────────────
    // METHOD: getOrderById
    // Akses: KASIR - Melihat detail 1 transaksi berdasarkan ID
    // ─────────────────────────────────────────────────────────────
    async getOrderById(orderId: number) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                orderItems: {
                    include: {
                        menu: { select: { name: true } },
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundException(`Order dengan ID ${orderId} tidak ditemukan`);
        }

        return this.formatNota(order);
    }

    // ─────────────────────────────────────────────────────────────
    // HELPER: formatNota
    // Memformat data order mentah menjadi nota yang mudah dibaca
    // ─────────────────────────────────────────────────────────────
    private formatNota(order: any) {
        return {
            // ── Header Nota ──
            nota: {
                idTransaksi: order.id,
                tanggal: new Date(order.createdAt).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                }),
                namaPembeli: order.user.name,
            },
            // ── Detail Item ──
            items: order.orderItems.map((oi: any) => ({
                menu: oi.menu.name,
                quantity: oi.quantity,
                hargaSatuan: `Rp${oi.price.toLocaleString('id-ID')}`,
                subtotal: `Rp${(oi.price * oi.quantity).toLocaleString('id-ID')}`,
            })),
            // ── Footer Nota ──
            totalBayar: `Rp${order.totalPrice.toLocaleString('id-ID')}`,
            pesan: 'Terima kasih sudah makan di Mie Gacoan! 🍜',
        };
    }
}