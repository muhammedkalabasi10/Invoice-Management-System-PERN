import InvoiceModel from "../models/InvoiceModel.js";
import nodemailer from "nodemailer";

export const getInvoices = async (req, res) => {
  let invoices = [];
  try {
    const allInvoices = await InvoiceModel.fetch();
    Promise.all(
      allInvoices.rows.map(async (invoice) => {
        const items = await InvoiceModel.getItems(invoice._id);
        const payments=await InvoiceModel.getPayments(invoice._id)
        invoices.push({
          _id: invoice._id,
          dueDate: invoice.dueDate,
          items: items,
          paymentRecords: payments.rows,
          client: {
            name: invoice.name,
            email: invoice.email,
            phone: invoice.phone,
            address: invoice.address,
          },
          total: invoice.total,
          status: invoice.status,
          creatorId: invoice.creatorId,
          createDate: invoice.createDate,
        });
      })
    ).then(() => {
      res.status(200).json(invoices);
    });
  } catch (error) {
    res.status(409).json(error.message);
  }
};

export const addInvoice = async (req, res) => {
  const invoiceData = await req.body;
  const invoice = new InvoiceModel(
    null,
    invoiceData.dueDate,
    invoiceData.client,
    parseFloat(invoiceData.total),
    invoiceData.status,
    invoiceData.creatorId,
    invoiceData.createDate
  );
  try {
    const savedInvoice = await invoice.saveInvoice()
    await invoiceData.items.forEach((element) => {
      element.taxname=element.tax.taxname
      element.taxvalue=element.tax.taxvalue
      delete element.tax
      element.invoiceId = savedInvoice.rows[0]._id;
    });
    const products = await invoiceData.items.map((item) => {
      return Object.values(item);
    });
    await invoice.saveItems(products)
    invoiceData["_id"] = savedInvoice.rows[0]._id;
    res.status(201).json(invoiceData);
  } catch (err) {
    res.status(409).json(err.message);
  }
};

export const getInvoice = async (req, res) => {
  const { id } = await req.params;
  let invoice = {
    _id: id,
    dueDate: "",
    items: [],
    client: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
    total: 0,
    status: "",
    creatorId: 0,
    createDate: "",
  };
  try {
    const invoiceData = await InvoiceModel.getInvoice(id);
    const inv = await invoiceData.rows[0];
    invoice.dueDate = await inv.dueDate;
    invoice.total = await inv.total;
    invoice.status = await inv.status;
    invoice.creatorId = await inv.creatorId;
    invoice.createDate = await inv.createDate;
    invoice.client.name = await inv.name;
    invoice.client.email = await inv.email;
    invoice.client.phone = await inv.phone;
    invoice.client.address = await inv.address;
    const items = await InvoiceModel.getItems(id);
    const paymentRecords=await InvoiceModel.getPayments(id);
    invoice.items = items;
    invoice.paymentRecords=paymentRecords.rows
    res.status(200).json(invoice);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const addPayment = async (req, res) => {
  const { id: _id } = await req.params;
  const {paymentRecords} = await req.body;
  console.log(paymentRecords[paymentRecords.length-1])
  const invoice=await req.body
  try {
    if(invoice.status==="Paid"){
      await InvoiceModel.doPaid(_id)
    }
    await InvoiceModel.addPayment(paymentRecords[paymentRecords.length-1].payment,paymentRecords[paymentRecords.length-1].datePaid, _id )
    res.json(invoice);
  } catch (err) {
    res.json({ message: err.message });
  }
};

export const deleteInvoice = async (req, res) => {
  const { id } = await req.params;
    InvoiceModel.delete(id).then(() => {
      res.json({ message: "Invoice deleted successfully" });
    })
    .catch((err) => res.json({ message: err.message }));
};

export const sendEmail = async (req, res) => {
  const { invoice, receiverEmail } = await req.body;
  let message = await `<html><body>
      <h3>Client</h3>
      <p>${invoice.client.name}, ${invoice.client.phone}, ${invoice.client.address}</p>
      <h3>Due Date</h3>
      <p>${invoice.dueDate}</p>
      <table><tr>
      <th>No</th>
      <th>Product Name</th>
      <th>Product Photo</th>
      <th>Quantity</th>
      <th>Unit</th>
      <th>Tax</th>
      <th>Price</th>
      <th>Discount(%)</th>
      <th>Total Price</th></tr>`;
  message += await invoice.items.map((item, index) => {
    return;
    `<tr>
        <td>${index + 1}</td>
        <td>${item.itemName}</td>
        <td><img
                        src=${item.selectedFiles}
                        alt=""
                        width="150"
                        height="100"
                        value=${item.selectedFiles}
                      /></td>
        <td>${item?.quantity}</td>
        <td>${item?.unit}</td>
                    <td>%${item?.tax.taxname}</td>
                    <td>${item?.unitPrice}</td>
                    <td>%${item?.discount}</td>
                    <td>
                      ${(
                        item.unitPrice *
                        item.quantity *
                        ((100 + item.tax.taxvalue) / 100) *
                        ((100 - item.discount) / 100)
                      ).toFixed(2)}
                    </td>
        </tr>`;
  });
  message += await `</table></body></html>`;
  const transporter = await nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    /*tls:{
            rejectUnauthorized:false
        }*/
  });
  transporter.sendMail(
    {
      from: process.env.EMAIL_USERNAME,
      to: `${receiverEmail}`,
      subject: "Invoice",
      text: "Invoice Text",
      html: message,
    },
    (error, info) => {
      if (error) console.log(error);
      else console.log(info);
    }
  );
};
