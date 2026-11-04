# Portfolio

Trang cá nhân tĩnh của Trần Việt Hoàng: trang chủ, danh sách dự án, giới thiệu, portfolio một trang và CV in được.

Có tiếng Việt (mặc định), English và 日本語. Giao diện sáng và tối.

## Các trang

| File | Nội dung |
| --- | --- |
| `index.html` | Trang chủ: lời chào và danh sách dự án |
| `projects.html` | Dự án dạng thẻ |
| `about.html` | Giới thiệu |
| `portfolio.html` | Portfolio một trang: dự án, kỹ năng, liên hệ |
| `cv.html` | CV khổ A4, in được |
| `404.html` | Trang không tìm thấy |

## Sửa nội dung

Mọi chữ cần sửa nằm trong [`assets/js/data.js`](assets/js/data.js): tên, liên hệ, kỹ năng, dự án, câu chữ giao diện và CV.

- `profile`: tên, email, GitHub, khẩu hiệu, giới thiệu, kỹ năng.
- `projects`: mỗi dự án một mục, đủ ba thứ tiếng. Thêm dự án thì chép một mục, đổi `url`, `image` và chữ. Ảnh để trong `assets/img/`.
- `strings`: chữ của giao diện (menu, nút, tiêu đề). `{name}` được thay bằng `profile.name`.
- `meta`: mô tả dùng cho thẻ tìm kiếm.
- `heroCode`: khối code trang trí trên trang portfolio.
- `cv`: số điện thoại, nơi ở, kinh nghiệm, học vấn, dự án in trên CV. Kỹ năng trên CV lấy từ `profile.skills`.

Thiếu bản dịch thì trang dùng tiếng Việt. `strings` có khóa `pf.intro1` được chèn dạng HTML.

Sửa xong thì xuất lại vào các trang:

```bash
yarn export
```

Lệnh này điền tiêu đề, liên kết, danh sách dự án tĩnh và CV. Phần danh sách dự án lúc mở trang vẫn đọc `data.js` trực tiếp.

Ảnh đại diện là file `assets/img/avatar.svg`, gắn trong `index.html` và `about.html`.

## CV

Nội dung CV sửa trong `cv` của `data.js`, rồi chạy lệnh xuất ở trên. Ảnh đặt tại `cv.photo` (mặc định `assets/img/cv-photo.svg`).

Nút tải PDF trỏ tới `assets/cv/<pdfBase>-VI.pdf`, bản EN và JA. Tên file lấy từ `cv.pdfBase`. Sau khi xuất, tạo lại PDF bằng Google Chrome:

```bash
sh scripts/build-cv-pdf.sh
```

Trên Windows, đặt biến `CHROME` trỏ tới `chrome.exe` trước khi chạy script.

## PDF CV từ bộ input riêng

Luồng `yarn export` ở trên không đổi. Mỗi CV in riêng là một thư mục trong `cv/input/`, tên thư mục là tên CV. Trong đó có `data.js` (cùng dạng `window.SITE` như [`assets/js/data.js`](assets/js/data.js)) và các file mà `data.js` trỏ tới, ví dụ ảnh `photo.svg` với `cv.photo: 'photo.svg'`. Đường dẫn trong `data.js` tính từ thư mục đó, không phải từ gốc dự án. Mẫu nằm ở `cv/input/sample/`.

```bash
yarn cv_genarate sample
yarn cv_genarate
```

Đối số là tên thư mục. Bỏ trống thì in mọi thư mục trong `cv/input`. PDF ghi ra `cv/output/`, tên file trùng tên thư mục. Cần Google Chrome hoặc Edge. Nếu không nằm ở đường dẫn thường gặp, đặt biến `CHROME` trỏ tới `chrome.exe`.

## JPEG và JPG sang SVG

Code nằm trong `jpeg-to-svg/`. Ảnh gốc để trong `jpeg-to-svg/input/`, file SVG ra `jpeg-to-svg/output/`, phần tên giữ nguyên.

```bash
yarn convert_img ten-anh
yarn convert_img
```

Đối số là tên file, không cần đuôi. Lệnh tự tìm `ten-anh.jpg` hoặc `ten-anh.jpeg`. Bỏ trống thì chuyển mọi ảnh jpg và jpeg trong `jpeg-to-svg/input`. Ảnh được vẽ lại thành đường vector, nên SVG là dạng poster, không giữ từng điểm ảnh. Cạnh dài hơn 1024 px được thu nhỏ trước khi vẽ.

## Chạy thử trên máy

Xem trang không cần cài thêm gì. Yarn cần khi chạy `yarn export`, `yarn cv_genarate` hoặc `yarn convert_img`:

```bash
python -m http.server 8765
```

Mở http://localhost:8765. Thêm `?lang=en` hoặc `?lang=ja` để mở thẳng bằng thứ tiếng đó.

## Đăng lên

GitHub Pages có thể phục vụ thẳng nhánh `main`, thư mục gốc. Push là lên.

## Nguồn

Dự án này là một bản fork từ repo portfolio của Kiên Duy (Nguyễn Duy Kiên), GitHub [@nkocvodoi](https://github.com/nkocvodoi): [github.com/nkocvodoi/portfolio](https://github.com/nkocvodoi/portfolio).
