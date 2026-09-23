/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

//! This example is taken from Room108 project


//* *****************  PDF  **********************

async function createPDF(opt = "download") {
  pdfMake.fonts = {
    WorkSans: {
      normal: "WorkSans-Regular.ttf",
      bold: "WorkSans-Bold.ttf",
      italic: "WorkSans-Italic.ttf",
      boldItalic: "WorkSans-BoldItalic.ttf",
    },
  };

  try {
    const pdfImg = await captureCanvas({
      renderer: renderer,
      scene: scene,
      cameraPosition: new THREE.Vector3(testVarX, testVarY, testVarZ),
      cameraLookAt: new THREE.Vector3(testVarLookAtX, testVarLookAtY, testVarLookAtZ),
      width: 1920,
      height: 1080,
      filename: 'my_table.jpg',
      format: 'image/jpeg',
      download: false,
    });

    const summaryArray = getSummary('#ar_filter');

    summaryArray.forEach((item) => {
      if (item.groupTitle.toLowerCase() === 'vorm' ||
        item.groupTitle.toLowerCase() === 'randafwerking') {
        const iconMName = item.optionTitle.replace(/[\s.]/g, '').toLowerCase();
        item.optionImageUrl = pdfIcons[item.groupTitle.toLowerCase()][iconMName] || '';
      }

      if (item.groupTitle.toLowerCase() === 'poot') {
        item.optionImageUrl = '';
      }
    });

    const summaryWithImages = await processImagesInSummary(summaryArray);
    const logoImage = await loadImageAsDataUrl(pdfIcons.logo);

    function generatePDFcontentFromSummary() {
      const content = [];
      summaryWithImages.forEach((item) => {
        let centerColumn;
        if (item.optionImage) {
          centerColumn = {
            image: item.optionImage,
            fit: [38, 18],
            alignment: 'center',
            width: 50,
            margin: [0, -2, 0, 0]
          };
        } else {
          centerColumn = { text: '', width: 50 };
        }

        content.push({
          columns: [
            { text: item.groupTitle, width: '*', style: 'groupTitleStyle' },
            centerColumn,
            { text: item.optionTitle, width: '*', style: 'optionTitleStyle' }
          ],
          margin: [0, 12, 0, 12]
        });

        content.push({
          canvas: [{
            type: 'line', x1: 0, y1: 0, x2: 515, y2: 0,
            lineWidth: 0.25,
            lineColor: '#F19141'
          }]
        });
      });

      return content;
    }

    const mainMargins = [40, 110, 40, 30];

    let headerContent = {};

    if (logoImage) {
      headerContent = {
        stack: [{
          image: logoImage,
          width: 130,
          margin: [0, 30, 0, 10],
          alignment: "center",
        }]
      };
    }

    const pdfContent = [];

    pdfContent.push({
      text: "All measurments, design and placement are approximate and subject for approval uppon execution of order.",
      margin: [0, 0, 0, 20],
      alignment: "center",
      style: "textStyle",
    });

    if (pdfImg) {
      pdfContent.push({
        image: pdfImg,
        width: 450,
        alignment: 'center',
        margin: [0, 0, 0, 30],
      });
    }

    pdfContent.push(...generatePDFcontentFromSummary());

    const pdfDefinition = {
      pageMargins: mainMargins,
      header: headerContent,
      content: pdfContent,
      styles: {
        textStyle: {
          fontSize: 12,
          color: '#333333',
          bold: false,
        },
        groupTitleStyle: {
          fontSize: 12,
          color: '#333333',
          bold: true,
        },
        optionTitleStyle: {
          fontSize: 12,
          color: '#F19141',
          bold: true,
          alignment: 'right',
        }
      },
      defaultStyle: {
        font: "WorkSans",
      },
    };
    switch (opt) {
      case "open":
        pdfMake.createPdf(pdfDefinition).open();
        break;

      case "download":
        pdfMake.createPdf(pdfDefinition).download("Room108_table.pdf");
        break;

      case "all":
        pdfMake.createPdf(pdfDefinition).getBlob((pdfBlob) => {
          const urlForTab = URL.createObjectURL(pdfBlob);
          window.open(urlForTab);

          const link = document.createElement("a");
          link.href = urlForTab;
          link.download = "Room108_table.pdf";
          link.click();

          URL.revokeObjectURL(urlForTab);
        });
        break;

      default:
        pdfMake.createPdf(pdfDefinition).download("Room108_table.pdf");
        break;
    }
  } catch (error) {
    console.error("Error creating PDF:", error);
  }
}

function getSummary(containerSelector) {
  const summary = [];

  jQuery(containerSelector).find('.ar_filter_group:not(.disabled)').each(function () {
    const group = jQuery(this);
    let groupTitle = '';
    let optionImageUrl = '';
    let optionTitle = '';

    const captionElement = group.find('.ar_filter_caption');
    if (captionElement.length) {
      groupTitle = captionElement.text().trim();
    }

    const activeOption = group.find('.option.active');
    if (activeOption.length) {
      const titleElement = activeOption.find('.component_title');
      if (titleElement.length) {
        optionTitle = titleElement.text().trim();
      }

      const imageElement = activeOption.find('img');
      if (imageElement.length) {
        optionImageUrl = imageElement.attr('src');
      }
    }

    if (groupTitle) {
      summary.push({
        groupTitle: groupTitle,
        optionImageUrl: optionImageUrl,
        optionTitle: optionTitle,
      });
    }
  });

  return summary;
}

async function processImagesInSummary(summaryArray) {
  const processingPromises = summaryArray.map(async (item) => {
    const processedItem = { ...item };

    if (processedItem.optionImageUrl && processedItem.optionImageUrl.trim() !== '') {
      try {
        const imageDataUrl = await loadImageAsDataUrl(processedItem.optionImageUrl);
        processedItem.optionImage = imageDataUrl;
      } catch (error) {
        console.error(`Error processing image: ${processedItem.optionImageUrl}`, error);
        processedItem.optionImage = null;
      }
    } else {
      processedItem.optionImage = null;
    }

    return processedItem;
  });

  return Promise.all(processingPromises);
}
