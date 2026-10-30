# Portfolio mẫu

Trang cá nhân tĩnh: trang chủ, danh sách dự án, giới thiệu, portfolio một trang và CV in được. Nội dung đang để sẵn là bản mẫu (tên, liên hệ, kỹ năng, dự án). Hãy thay bằng thông tin của bạn trước khi đăng.

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

- `profile`: tên, chữ viết tắt trên avatar, email, GitHub, khẩu hiệu, giới thiệu, kỹ năng.
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

Lệnh này điền tiêu đề, liên kết, danh sách dự án tĩnh, CV và chữ trên avatar. Phần danh sách dự án lúc mở trang vẫn đọc `data.js` trực tiếp.

Ảnh đại diện mẫu là chữ viết tắt trong `assets/img/avatar.svg`, lấy từ `profile.initials`. Muốn dùng ảnh thật thì đặt `assets/img/avatar.jpg` và đổi `avatar.svg` thành `avatar.jpg` trong `index.html` và `about.html`.

## CV

Nội dung CV sửa trong `cv` của `data.js`, rồi chạy lệnh xuất ở trên. Ảnh đặt tại `cv.photo` (mặc định `assets/img/cv-photo.svg`).

Nút tải PDF trỏ tới `assets/cv/<pdfBase>-VI.pdf`, bản EN và JA. Tên file lấy từ `cv.pdfBase`. Sau khi xuất, tạo lại PDF bằng Google Chrome:

```bash
sh scripts/build-cv-pdf.sh
```

Trên Windows, đặt biến `CHROME` trỏ tới `chrome.exe` trước khi chạy script.

## Chạy thử trên máy

Xem trang không cần cài thêm gì. Yarn chỉ cần khi chạy `yarn export` ở trên:

```bash
python -m http.server 8765
```

Mở http://localhost:8765. Thêm `?lang=en` hoặc `?lang=ja` để mở thẳng bằng thứ tiếng đó.

## Đăng lên

GitHub Pages có thể phục vụ thẳng nhánh `main`, thư mục gốc. Push là lên.

## Nguồn

Dự án này là một bản fork từ repo portfolio của Kiên Duy (Nguyễn Duy Kiên), GitHub [@nkocvodoi](https://github.com/nkocvodoi): [github.com/nkocvodoi/portfolio](https://github.com/nkocvodoi/portfolio). Tên, kỹ năng, dự án và CV của tác giả đã được thay bằng nội dung mẫu để dùng làm portfolio cá nhân.
