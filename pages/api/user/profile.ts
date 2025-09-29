import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = (await getServerSession(req, res, authOptions as any)) as any;
  if (!session || !session.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const userId = session.user.id as string;

  try {
    if (req.method === "GET") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });
      if (!user) return res.status(404).json({ message: "User not found" });

      const [firstName = "", ...rest] = (user.name || "").split(" ");
      const lastName = rest.join(" ");

      let roleData: any = {};
      if (user.role === "STUDENT") {
        const stu = await prisma.student.findFirst({
          where: { userId },
          select: {
            matricNumber: true,
            phone: true,
            address: true,
            emergencyContact: true,
            departmentId: true,
          },
        });
        let department: any = null;
        if (stu?.departmentId) {
          department = await prisma.department.findUnique({
            where: { id: stu.departmentId },
            select: { id: true, name: true, code: true },
          });
        }
        roleData = {
          matricNumber: stu?.matricNumber || null,
          phone: stu?.phone || null,
          address: stu?.address || null,
          emergencyContact: stu?.emergencyContact || null,
          department,
        };
      } else if (user.role === "LECTURER") {
        const lec = await prisma.lecturer.findFirst({
          where: { userId },
          select: {
            title: true,
            staffId: true,
            departmentId: true,
          },
        });
        let department: any = null;
        if (lec?.departmentId) {
          department = await prisma.department.findUnique({
            where: { id: lec.departmentId },
            select: { id: true, name: true, code: true },
          });
        }
        roleData = {
          title: lec?.title || null,
          staffId: lec?.staffId || null,
          department,
        };
      } else if (user.role === "DEPARTMENT_ADMIN") {
        const da = await prisma.departmentAdmin.findFirst({
          where: { userId },
          select: {
            title: true,
            adminId: true,
            departmentId: true,
          },
        });
        let department: any = null;
        if (da?.departmentId) {
          department = await prisma.department.findUnique({
            where: { id: da.departmentId },
            select: { id: true, name: true, code: true },
          });
        }
        roleData = {
          title: da?.title || null,
          adminId: da?.adminId || null,
          department,
        };
      } else if (user.role === "SCHOOL_ADMIN") {
        const sa = await prisma.schoolAdmin.findFirst({
          where: { userId },
          select: {
            title: true,
            adminId: true,
            schoolId: true,
          },
        });
        let school: any = null;
        if (sa?.schoolId) {
          school = await prisma.school.findUnique({
            where: { id: sa.schoolId },
            select: { id: true, name: true, code: true },
          });
        }
        roleData = {
          title: sa?.title || null,
          adminId: sa?.adminId || null,
          school,
        };
      } else if (user.role === "SENATE_ADMIN") {
        const sena = await prisma.senateAdmin.findFirst({
          where: { userId },
          select: {
            title: true,
            adminId: true,
          },
        });
        roleData = {
          title: sena?.title || null,
          adminId: sena?.adminId || null,
        };
      }

      return res.status(200).json({
        id: user.id,
        email: user.email,
        firstName,
        lastName,
        role: user.role,
        isActive: user.isActive,
        ...roleData,
      });
    }

    if (req.method === "PUT") {
      const {
        firstName,
        lastName,
        email,
        title,
        matricNumber,
        staffId,
        adminId,
        phone,
        address,
        emergencyContact,
      } = req.body as {
        firstName?: string;
        lastName?: string;
        email?: string | null;
        title?: string | null;
        matricNumber?: string | null;
        staffId?: string | null;
        adminId?: string | null;
        phone?: string | null;
        address?: string | null;
        emergencyContact?: string | null;
      };
      const fn = (firstName || "").trim();
      const ln = (lastName || "").trim();
      if (!fn || !ln) {
        return res
          .status(400)
          .json({ message: "First name and last name are required" });
      }

      const fullName = [fn, ln].join(" ");
      // Update User.name/email and propagate name to role-specific profile tables
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      const tx: any[] = [
        prisma.user.update({
          where: { id: userId },
          data: {
            name: fullName,
            email: email ?? undefined,
            firstName: fn,
            lastName: ln,
          },
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        }),
      ];

      switch (dbUser?.role) {
        case "STUDENT":
          tx.push(
            prisma.student.updateMany({
              where: { userId },
              data: {
                name: fullName || "",
                firstName: fn,
                lastName: ln,
                ...(phone ? { phone } : {}),
                ...(address ? { address } : {}),
                ...(emergencyContact ? { emergencyContact } : {}),
              },
            })
          );
          break;
        case "LECTURER":
          tx.push(
            prisma.lecturer.updateMany({
              where: { userId },
              data: {
                name: fullName || "",
                firstName: fn,
                lastName: ln,
                ...(title ? { title } : {}),
                ...(staffId ? { staffId } : {}),
              },
            })
          );
          break;
        case "DEPARTMENT_ADMIN":
          tx.push(
            prisma.departmentAdmin.updateMany({
              where: { userId },
              data: {
                name: fullName || "",
                firstName: fn,
                lastName: ln,
                ...(title ? { title } : {}),
                ...(adminId ? { adminId } : {}),
              },
            })
          );
          break;
        case "SCHOOL_ADMIN":
          tx.push(
            prisma.schoolAdmin.updateMany({
              where: { userId },
              data: {
                name: fullName || "",
                firstName: fn,
                lastName: ln,
                ...(title ? { title } : {}),
                ...(adminId ? { adminId } : {}),
              },
            })
          );
          break;
        case "SENATE_ADMIN":
          tx.push(
            prisma.senateAdmin.updateMany({
              where: { userId },
              data: {
                name: fullName || "",
                firstName: fn,
                lastName: ln,
                ...(title ? { title } : {}),
                ...(adminId ? { adminId } : {}),
              },
            })
          );
          break;
        default:
          break;
      }

      const [updated] = await prisma.$transaction(tx);
      const [firstOut = "", ...lnRest] = (updated.name || "").split(" ");

      // Re-read role-specific data to return fresh snapshot
      const freshReq = { ...req, method: "GET" } as NextApiRequest;
      // Instead of recursively calling handler, we manually reconstruct minimal payload
      const role = dbUser?.role;
      let roleData: any = {};
      if (role === "STUDENT") {
        const stu = await prisma.student.findFirst({
          where: { userId },
          select: {
            matricNumber: true,
            phone: true,
            address: true,
            emergencyContact: true,
            departmentId: true,
          },
        });
        let department: any = null;
        if (stu?.departmentId)
          department = await prisma.department.findUnique({
            where: { id: stu.departmentId },
            select: { id: true, name: true, code: true },
          });
        roleData = {
          matricNumber: stu?.matricNumber || null,
          phone: stu?.phone || null,
          address: stu?.address || null,
          emergencyContact: stu?.emergencyContact || null,
          department,
        };
      } else if (role === "LECTURER") {
        const lec = await prisma.lecturer.findFirst({
          where: { userId },
          select: { title: true, staffId: true, departmentId: true },
        });
        let department: any = null;
        if (lec?.departmentId)
          department = await prisma.department.findUnique({
            where: { id: lec.departmentId },
            select: { id: true, name: true, code: true },
          });
        roleData = {
          title: lec?.title || null,
          staffId: lec?.staffId || null,
          department,
        };
      } else if (role === "DEPARTMENT_ADMIN") {
        const da = await prisma.departmentAdmin.findFirst({
          where: { userId },
          select: { title: true, adminId: true, departmentId: true },
        });
        let department: any = null;
        if (da?.departmentId)
          department = await prisma.department.findUnique({
            where: { id: da.departmentId },
            select: { id: true, name: true, code: true },
          });
        roleData = {
          title: da?.title || null,
          adminId: da?.adminId || null,
          department,
        };
      } else if (role === "SCHOOL_ADMIN") {
        const sa = await prisma.schoolAdmin.findFirst({
          where: { userId },
          select: { title: true, adminId: true, schoolId: true },
        });
        let school: any = null;
        if (sa?.schoolId)
          school = await prisma.school.findUnique({
            where: { id: sa.schoolId },
            select: { id: true, name: true, code: true },
          });
        roleData = {
          title: sa?.title || null,
          adminId: sa?.adminId || null,
          school,
        };
      } else if (role === "SENATE_ADMIN") {
        const sena = await prisma.senateAdmin.findFirst({
          where: { userId },
          select: { title: true, adminId: true },
        });
        roleData = {
          title: sena?.title || null,
          adminId: sena?.adminId || null,
        };
      }

      return res.status(200).json({
        id: updated.id,
        email: updated.email,
        firstName: firstOut,
        lastName: lnRest.join(" "),
        role,
        ...roleData,
      });
    }

    res.setHeader("Allow", ["GET", "PUT"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ message: "Email already in use" });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
